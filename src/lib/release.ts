export type LandingReleaseEnv = Readonly<{
  NEXT_PUBLIC_MUZA_RELEASE_TAG?: string;
  NEXT_PUBLIC_MUZA_RELEASE_URL?: string;
  NEXT_PUBLIC_MUZA_RELEASE_SHA256?: string;
  NEXT_PUBLIC_MUZA_RELEASE_SIZE?: string;
}>;

export type LandingRelease =
  | Readonly<{
      kind: "preparing";
      repositoryUrl: "https://github.com/EntonioDMI/muza-client";
    }>
  | Readonly<{
      kind: "available";
      repositoryUrl: "https://github.com/EntonioDMI/muza-client";
      tag: string;
      downloadUrl: string;
      sha256: string;
      sizeBytes: number;
    }>;

const REPOSITORY_URL = "https://github.com/EntonioDMI/muza-client" as const;
/** Страница релизов — для ссылок «следить за релизом» (там же виден Watch) */
export const REPOSITORY_RELEASES_URL = `${REPOSITORY_URL}/releases` as const;
/** Веб-версия плеера (статический экспорт apps/web на поддомене). */
export const WEB_APP_URL = "https://app.muza.lol" as const;
const TAG_PATTERN = /^v(?:0|[1-9]\d{0,4})\.(?:0|[1-9]\d{0,4})\.(?:0|[1-9]\d{0,4})$/;
const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const SIZE_PATTERN = /^[1-9]\d*$/;
const ASSET_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,123}\.exe$/;

export function parseLandingRelease(env: LandingReleaseEnv): LandingRelease {
  const values = [
    env.NEXT_PUBLIC_MUZA_RELEASE_TAG,
    env.NEXT_PUBLIC_MUZA_RELEASE_URL,
    env.NEXT_PUBLIC_MUZA_RELEASE_SHA256,
    env.NEXT_PUBLIC_MUZA_RELEASE_SIZE,
  ] as const;

  if (values.every((value) => value === undefined)) {
    return { kind: "preparing", repositoryUrl: REPOSITORY_URL };
  }
  if (values.some((value) => value === undefined)) {
    throw new Error("release configuration must define all four values or none");
  }

  const [tag, downloadUrl, sha256, rawSize] = values as readonly [string, string, string, string];
  if ([tag, downloadUrl, sha256, rawSize].some((value) => value.length === 0 || value.trim().length === 0)) {
    throw new Error("release configuration cannot be empty or whitespace");
  }
  if (!TAG_PATTERN.test(tag) || tag.length > 18) {
    throw new Error("release tag must be canonical stable vMAJOR.MINOR.PATCH");
  }
  if (!SHA256_PATTERN.test(sha256)) {
    throw new Error("release SHA-256 must be 64 lowercase hexadecimal characters");
  }
  if (!SIZE_PATTERN.test(rawSize)) {
    throw new Error("release size must be a canonical positive decimal integer");
  }
  const sizeBytes = Number(rawSize);
  if (!Number.isSafeInteger(sizeBytes) || sizeBytes <= 0) {
    throw new Error("release size must be a positive safe integer");
  }

  const prefix = `${REPOSITORY_URL}/releases/download/${encodeURIComponent(tag)}/`;
  if (!downloadUrl.startsWith(prefix)) {
    throw new Error("release URL must use the canonical repository and configured tag");
  }
  const asset = downloadUrl.slice(prefix.length);
  if (!ASSET_PATTERN.test(asset)) {
    throw new Error("release asset must be one safe 5-128 character exe segment");
  }
  const canonicalUrl = `${prefix}${asset}`;
  if (downloadUrl !== canonicalUrl) {
    throw new Error("release URL is not byte-canonical");
  }

  let parsed: URL;
  try {
    parsed = new URL(downloadUrl);
  } catch {
    throw new Error("release URL is invalid");
  }
  if (
    parsed.protocol !== "https:"
    || parsed.hostname !== "github.com"
    || parsed.origin !== "https://github.com"
    || parsed.username !== ""
    || parsed.password !== ""
    || parsed.port !== ""
    || parsed.search !== ""
    || parsed.hash !== ""
    || parsed.href !== canonicalUrl
  ) {
    throw new Error("release URL failed canonical HTTPS GitHub validation");
  }

  return {
    kind: "available",
    repositoryUrl: REPOSITORY_URL,
    tag,
    downloadUrl,
    sha256,
    sizeBytes,
  };
}

export function formatReleaseSize(sizeBytes: number): string {
  if (!Number.isSafeInteger(sizeBytes) || sizeBytes <= 0) {
    throw new Error("release size must be a positive safe integer");
  }
  const units = [
    { bytes: 1024 ** 3, label: "ГБ" },
    { bytes: 1024 ** 2, label: "МБ" },
    { bytes: 1024, label: "КБ" },
  ] as const;
  const unit = units.find((candidate) => sizeBytes >= candidate.bytes);
  if (!unit) return `${sizeBytes} Б`;
  const value = sizeBytes / unit.bytes;
  const formatted = (Number.isInteger(value) ? String(value) : value.toFixed(1)).replace(".", ",");
  return `${formatted} ${unit.label}`;
}

export function abbreviateSha256(sha256: string): string {
  if (!SHA256_PATTERN.test(sha256)) {
    throw new Error("release SHA-256 must be 64 lowercase hexadecimal characters");
  }
  return `${sha256.slice(0, 12)}…`;
}
