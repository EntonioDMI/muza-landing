import { pathToFileURL } from "node:url";

// Резолвит ПОСЛЕДНИЙ опубликованный стабильный релиз muza-client в build-env
// лендинга (NEXT_PUBLIC_MUZA_RELEASE_*). Используется workflow'ом
// .github/workflows/landing-rebuild.yml: его вывод уходит в $GITHUB_ENV, дальше
// pnpm build прогоняет verify-release.mjs — тот ЗАНОВО сверит эти значения с
// GitHub API. Двойная проверка намеренная: resolve отвечает «что сейчас Latest»,
// verify — «конфиг сборки не врёт»; сломается любой из них — сборка упадёт, а не
// молча запечёт мусор.
//
// Логика фетча сознательно продублирована с check-drift.mjs / verify-release.mjs,
// а не вынесена в общий модуль: у трёх скриптов разные задачи и разные наборы
// полей, и по прецеденту в этом репо каждый самодостаточен.

const LATEST_RELEASE_API = "https://api.github.com/repos/EntonioDMI/muza-client/releases/latest";
const USER_AGENT = "muza-landing-release-resolver";

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export async function resolveLatestRelease({ fetchImpl }) {
  if (typeof fetchImpl !== "function") throw new Error("release resolver requires fetchImpl");

  const response = await fetchImpl(LATEST_RELEASE_API, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": USER_AGENT,
    },
    signal: AbortSignal.timeout(15_000),
  });
  if (!isRecord(response) || response.ok !== true) {
    const status = isRecord(response) && typeof response.status === "number" ? response.status : "unknown";
    throw new Error(`GitHub latest-release request failed with status ${status}`);
  }

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
  // /releases/latest по семантике API не возвращает draft/prerelease, но полагаться
  // на это молча нельзя — проверяем явно, как verify-release.mjs.
  if (payload.draft !== false) throw new Error("GitHub release must be public, not draft");
  if (payload.prerelease !== false) throw new Error("GitHub release must be stable, not prerelease");
  if (!Array.isArray(payload.assets)) throw new Error("GitHub release assets must be an array");

  const installers = payload.assets.filter(
    (asset) => isRecord(asset) && typeof asset.name === "string" && asset.name.endsWith(".exe"),
  );
  if (installers.length !== 1) throw new Error("GitHub release must contain exactly one .exe asset");
  const asset = installers[0];
  if (asset.state !== "uploaded") throw new Error("GitHub release asset is not uploaded");
  if (typeof asset.browser_download_url !== "string" || asset.browser_download_url.length === 0) {
    throw new Error("GitHub release asset has no download url");
  }
  if (typeof asset.size !== "number" || !Number.isInteger(asset.size) || asset.size <= 0) {
    throw new Error("GitHub release asset has no valid size");
  }
  if (typeof asset.digest !== "string" || !/^sha256:[0-9a-f]{64}$/.test(asset.digest)) {
    throw new Error("GitHub release asset has no sha256 digest");
  }

  return {
    tag: payload.tag_name,
    downloadUrl: asset.browser_download_url,
    sha256: asset.digest.slice("sha256:".length),
    sizeBytes: asset.size,
  };
}

// Формат вывода — строки KEY=value для $GITHUB_ENV. Значения приходят из GitHub
// API и не содержат переводов строк (тег/URL/hex/число) — multiline-heredoc не нужен.
export function toGithubEnv(release) {
  return [
    `NEXT_PUBLIC_MUZA_RELEASE_TAG=${release.tag}`,
    `NEXT_PUBLIC_MUZA_RELEASE_URL=${release.downloadUrl}`,
    `NEXT_PUBLIC_MUZA_RELEASE_SHA256=${release.sha256}`,
    `NEXT_PUBLIC_MUZA_RELEASE_SIZE=${release.sizeBytes}`,
  ].join("\n");
}

if (process.argv[1] !== undefined && pathToFileURL(process.argv[1]).href === import.meta.url) {
  try {
    const release = await resolveLatestRelease({ fetchImpl: globalThis.fetch });
    console.log(toGithubEnv(release));
  } catch (error) {
    console.error(`Muza release resolve failed: ${error instanceof Error ? error.message : error}`);
    process.exitCode = 1;
  }
}
