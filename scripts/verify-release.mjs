import { pathToFileURL } from "node:url";
import { parseLandingRelease } from "../src/lib/release.ts";

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export async function verifyRelease({ env, fetchImpl }) {
  const release = parseLandingRelease(env);
  if (release.kind === "preparing") return release;
  if (typeof fetchImpl !== "function") throw new Error("release verifier requires fetchImpl");

  const apiUrl =
    `https://api.github.com/repos/EntonioDMI/muza-client/releases/tags/${encodeURIComponent(release.tag)}`;
  const response = await fetchImpl(apiUrl, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "muza-landing-release-verifier",
    },
    signal: AbortSignal.timeout(15_000),
  });
  if (!isRecord(response) || response.ok !== true) {
    const status = isRecord(response) && typeof response.status === "number" ? response.status : "unknown";
    throw new Error(`GitHub release verification failed with status ${status}`);
  }

  let payload;
  try {
    payload = await response.json();
  } catch (error) {
    throw new Error(`GitHub release response is not valid JSON: ${error instanceof Error ? error.message : error}`);
  }
  if (!isRecord(payload)) throw new Error("GitHub release response must be an object");
  if (payload.tag_name !== release.tag) throw new Error("GitHub release tag mismatch");
  if (payload.draft !== false) throw new Error("GitHub release must be public, not draft");
  if (payload.prerelease !== false) throw new Error("GitHub release must be stable, not prerelease");
  if (!Array.isArray(payload.assets)) throw new Error("GitHub release assets must be an array");

  const matches = payload.assets.filter(
    (asset) => isRecord(asset) && asset.browser_download_url === release.downloadUrl,
  );
  if (matches.length !== 1) {
    throw new Error("GitHub release must contain exactly one configured download asset");
  }
  const asset = matches[0];
  if (asset.state !== "uploaded") throw new Error("GitHub release asset is not uploaded");
  if (typeof asset.size !== "number" || asset.size !== release.sizeBytes) {
    throw new Error("GitHub release asset size mismatch");
  }
  if (asset.digest !== `sha256:${release.sha256}`) {
    throw new Error("GitHub release asset digest mismatch");
  }

  return release;
}

if (process.argv[1] !== undefined && pathToFileURL(process.argv[1]).href === import.meta.url) {
  try {
    const release = await verifyRelease({ env: process.env, fetchImpl: globalThis.fetch });
    if (release.kind === "preparing") {
      console.log("Muza release: preparing; no download is published");
    } else {
      console.log(`Muza release verified: ${release.tag} · ${release.downloadUrl}`);
    }
  } catch (error) {
    console.error(`Muza release verification failed: ${error instanceof Error ? error.message : error}`);
    process.exitCode = 1;
  }
}
