import { pathToFileURL } from "node:url";

const LANDING_URL = "https://muza.lol/";
const LATEST_RELEASE_API = "https://api.github.com/repos/EntonioDMI/muza-client/releases/latest";
const USER_AGENT = "muza-landing-drift-check";

// Страница печатает подпись сокращённой — abbreviateSha256 (src/lib/release.ts)
// режет sha256 до 12 символов. Сверяем префикс: этого хватает, чтобы отличить
// один релиз от другого, а доказывать подлинность файла здесь и не нужно —
// это делает verify-release.mjs на сборке, против GitHub API.
const PAGE_SHA = /SHA-256 ([0-9a-f]{12})/;
const PAGE_TAG = /Muza (v\d+\.\d+\.\d+)/;

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

async function fetchOk(fetchImpl, url, headers) {
  const response = await fetchImpl(url, { headers, signal: AbortSignal.timeout(15_000) });
  if (!isRecord(response) || response.ok !== true) {
    const status = isRecord(response) && typeof response.status === "number" ? response.status : "unknown";
    throw new Error(`request to ${url} failed with status ${status}`);
  }
  return response;
}

export async function readLatestRelease(fetchImpl) {
  const response = await fetchOk(fetchImpl, LATEST_RELEASE_API, {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": USER_AGENT,
  });

  let payload;
  try {
    payload = await response.json();
  } catch (error) {
    throw new Error(`GitHub release response is not valid JSON: ${error instanceof Error ? error.message : error}`);
  }
  if (!isRecord(payload)) throw new Error("GitHub release response must be an object");
  if (typeof payload.tag_name !== "string" || payload.tag_name.length === 0) {
    throw new Error("GitHub release has no tag_name");
  }
  if (!Array.isArray(payload.assets)) throw new Error("GitHub release assets must be an array");

  const installers = payload.assets.filter(
    (asset) => isRecord(asset) && typeof asset.name === "string" && asset.name.endsWith(".exe"),
  );
  if (installers.length !== 1) throw new Error("GitHub release must contain exactly one .exe asset");
  const { digest } = installers[0];
  if (typeof digest !== "string" || !digest.startsWith("sha256:")) {
    throw new Error("GitHub release asset has no sha256 digest");
  }

  return { tag: payload.tag_name, sha256: digest.slice("sha256:".length) };
}

export async function readLandingPage(fetchImpl) {
  const response = await fetchOk(fetchImpl, LANDING_URL, { "User-Agent": USER_AGENT });
  const html = await response.text();
  if (typeof html !== "string" || html.length === 0) throw new Error("landing page is empty");
  return {
    tag: html.match(PAGE_TAG)?.[1] ?? null,
    sha256: html.match(PAGE_SHA)?.[1] ?? null,
  };
}

export function compareRelease(release, page) {
  if (page.tag === null || page.sha256 === null) {
    return {
      drifted: true,
      reason: `landing advertises no download, but release ${release.tag} is published`,
    };
  }
  if (page.tag !== release.tag) {
    return {
      drifted: true,
      reason: `landing advertises ${page.tag}, latest release is ${release.tag}`,
    };
  }
  // Тег совпал, а подпись нет: ассет перезалили под тем же тегом. Кнопка ведёт
  // на файл, чей хеш не равен напечатанному рядом — то есть страница врёт.
  if (!release.sha256.startsWith(page.sha256)) {
    return {
      drifted: true,
      reason: `landing advertises ${page.tag} with SHA-256 ${page.sha256}…, release asset is ${release.sha256.slice(0, 12)}…`,
    };
  }
  return {
    drifted: false,
    reason: `landing advertises ${page.tag} · SHA-256 ${page.sha256}…, matching the published release`,
  };
}

export async function checkDrift({ fetchImpl }) {
  if (typeof fetchImpl !== "function") throw new Error("drift check requires fetchImpl");
  const [release, page] = await Promise.all([readLatestRelease(fetchImpl), readLandingPage(fetchImpl)]);
  return compareRelease(release, page);
}

if (process.argv[1] !== undefined && pathToFileURL(process.argv[1]).href === import.meta.url) {
  try {
    const result = await checkDrift({ fetchImpl: globalThis.fetch });
    if (result.drifted) {
      // Префикс "Landing is stale:" — контракт с .github/workflows/landing-drift.yml:
      // по нему воркфлоу отличает расхождение от упавшей проверки и заводит issue
      // только на первое. Менять здесь — менять и там.
      console.error(`Landing is stale: ${result.reason}`);
      console.error("Rebuild muza-landing with the current release env and redeploy /var/www/muza-landing.");
      process.exitCode = 1;
    } else {
      console.log(`Landing is current: ${result.reason}`);
    }
  } catch (error) {
    console.error(`Landing drift check failed: ${error instanceof Error ? error.message : error}`);
    process.exitCode = 1;
  }
}
