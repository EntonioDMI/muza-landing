import { pathToFileURL } from "node:url";

const LANDING_URL = "https://muza.lol/";
const LATEST_RELEASE_API = "https://api.github.com/repos/EntonioDMI/muza-client/releases/latest";
const USER_AGENT = "muza-landing-drift-check";

// Вторая цель сторожа — веб-клиент. Он выкладывается на app.muza.lol РУКАМИ, и до
// 03.08.2026 сверять его было не с чем. Теперь сборка кладёт рядом с собой штамп
// (muza-client/apps/web/next.config.ts), и по нему видно три вещи, которые иначе
// не видны никак: собрано ли из чистого дерева, тот ли адрес сервера запечён и
// лежит ли коммит сборки в истории main (то есть проходил ли он проверки).
const WEB_CLIENT_STAMP_URL = "https://app.muza.lol/build-stamp.json";
const WEB_CLIENT_API_URL = "https://api.muza.lol/api";
const COMMIT_COMPARE_API = "https://api.github.com/repos/EntonioDMI/muza-client/compare/main...";
const GITHUB_HEADERS = {
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  "User-Agent": USER_AGENT,
};

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
  const response = await fetchOk(fetchImpl, LATEST_RELEASE_API, GITHUB_HEADERS);

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

// 404 — это не сбой проверки, а ответ: выложенная сборка не опознаётся. Отдаём null,
// расхождением его называет compareWebClient. Любой другой не-2xx (502 от Caddy,
// обрыв) — именно сбой, и он обязан упасть исключением: заводить issue по сетевой
// икоте нельзя, красный прогон владелец увидит и так.
export async function readWebClientStamp(fetchImpl) {
  const response = await fetchImpl(WEB_CLIENT_STAMP_URL, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(15_000),
  });
  if (isRecord(response) && response.ok !== true && response.status === 404) return null;
  if (!isRecord(response) || response.ok !== true) {
    const status = isRecord(response) && typeof response.status === "number" ? response.status : "unknown";
    throw new Error(`request to ${WEB_CLIENT_STAMP_URL} failed with status ${status}`);
  }

  let stamp;
  try {
    stamp = JSON.parse(await response.text());
  } catch (error) {
    throw new Error(`web client build stamp is not valid JSON: ${error instanceof Error ? error.message : error}`);
  }
  if (!isRecord(stamp)) throw new Error("web client build stamp must be an object");
  if (typeof stamp.commit !== "string" || !/^[0-9a-f]{40}$/.test(stamp.commit)) {
    throw new Error("web client build stamp has no commit sha");
  }
  if (typeof stamp.dirty !== "boolean") throw new Error("web client build stamp has no dirty flag");
  if (typeof stamp.api !== "string") throw new Error("web client build stamp has no api url");
  return {
    commit: stamp.commit,
    ref: typeof stamp.ref === "string" && stamp.ref !== "" ? stamp.ref : stamp.commit.slice(0, 12),
    dirty: stamp.dirty,
    api: stamp.api,
  };
}

// base=main, head=<коммит сборки>: "identical" — сборка с вершины main, "behind" —
// из её истории (нормально, веб пересобирается не на каждый коммит), "diverged" или
// "ahead" — коммита в main нет, то есть выложено то, что проверки не проходило.
export async function readCommitPosition(fetchImpl, commit) {
  const response = await fetchOk(fetchImpl, `${COMMIT_COMPARE_API}${commit}`, GITHUB_HEADERS);
  let payload;
  try {
    payload = await response.json();
  } catch (error) {
    throw new Error(`GitHub compare response is not valid JSON: ${error instanceof Error ? error.message : error}`);
  }
  if (!isRecord(payload) || typeof payload.status !== "string" || payload.status === "") {
    throw new Error("GitHub compare response has no status");
  }
  return payload.status;
}

export function compareWebClient(stamp, status) {
  if (stamp === null) {
    return { drifted: true, reason: "app.muza.lol publishes no build stamp: the deployed build cannot be identified" };
  }
  if (stamp.dirty) {
    return { drifted: true, reason: `app.muza.lol was built from a tree with uncommitted changes (${stamp.ref})` };
  }
  if (stamp.api !== WEB_CLIENT_API_URL) {
    return { drifted: true, reason: `app.muza.lol talks to ${stamp.api || "no API url"}, expected ${WEB_CLIENT_API_URL}` };
  }
  if (status !== "identical" && status !== "behind") {
    return { drifted: true, reason: `app.muza.lol runs ${stamp.ref}, a commit that is "${status}" against main` };
  }
  return { drifted: false, reason: `app.muza.lol runs ${stamp.ref} from main (${status}) against ${stamp.api}` };
}

export async function checkDrift({ fetchImpl }) {
  if (typeof fetchImpl !== "function") throw new Error("drift check requires fetchImpl");
  const [release, page, stamp] = await Promise.all([
    readLatestRelease(fetchImpl),
    readLandingPage(fetchImpl),
    readWebClientStamp(fetchImpl),
  ]);
  const landing = compareRelease(release, page);
  const web = compareWebClient(stamp, stamp === null ? null : await readCommitPosition(fetchImpl, stamp.commit));
  return {
    drifted: landing.drifted || web.drifted,
    reason: `${landing.reason}\n${web.reason}`,
  };
}

if (process.argv[1] !== undefined && pathToFileURL(process.argv[1]).href === import.meta.url) {
  try {
    const result = await checkDrift({ fetchImpl: globalThis.fetch });
    if (result.drifted) {
      // Префикс "Muza deploy is stale:" — контракт с .github/workflows/landing-drift.yml:
      // по нему воркфлоу отличает расхождение от упавшей проверки и заводит issue
      // только на первое. Менять здесь — менять и там.
      console.error(`Muza deploy is stale:\n${result.reason}`);
      process.exitCode = 1;
    } else {
      console.log(`Muza deploy is current:\n${result.reason}`);
    }
  } catch (error) {
    console.error(`Muza deploy check failed: ${error instanceof Error ? error.message : error}`);
    process.exitCode = 1;
  }
}
