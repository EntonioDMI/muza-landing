import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  abbreviateSha256,
  formatReleaseSize,
  parseLandingRelease,
  type LandingReleaseEnv,
} from "./release.ts";

const REPOSITORY_URL = "https://github.com/EntonioDMI/muza-client";
const TAG = "v1.2.3";
const ASSET = "Muza_1.2.3_x64-setup.exe";
const DOWNLOAD_URL = `${REPOSITORY_URL}/releases/download/${TAG}/${ASSET}`;
const SHA256 = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

const CANONICAL_ENV: LandingReleaseEnv = Object.freeze({
  NEXT_PUBLIC_MUZA_RELEASE_TAG: TAG,
  NEXT_PUBLIC_MUZA_RELEASE_URL: DOWNLOAD_URL,
  NEXT_PUBLIC_MUZA_RELEASE_SHA256: SHA256,
  NEXT_PUBLIC_MUZA_RELEASE_SIZE: "73400320",
});

const ENV_KEYS = [
  "NEXT_PUBLIC_MUZA_RELEASE_TAG",
  "NEXT_PUBLIC_MUZA_RELEASE_URL",
  "NEXT_PUBLIC_MUZA_RELEASE_SHA256",
  "NEXT_PUBLIC_MUZA_RELEASE_SIZE",
] as const;

function configured(overrides: Partial<LandingReleaseEnv>): LandingReleaseEnv {
  return { ...CANONICAL_ENV, ...overrides };
}

function urlFor(tag: string, asset = ASSET): string {
  return `${REPOSITORY_URL}/releases/download/${encodeURIComponent(tag)}/${asset}`;
}

describe("parseLandingRelease", () => {
  test("all four undefined values are the only preparing state", () => {
    assert.deepEqual(parseLandingRelease({}), {
      kind: "preparing",
      repositoryUrl: REPOSITORY_URL,
    });
    assert.deepEqual(
      parseLandingRelease({
        NEXT_PUBLIC_MUZA_RELEASE_TAG: undefined,
        NEXT_PUBLIC_MUZA_RELEASE_URL: undefined,
        NEXT_PUBLIC_MUZA_RELEASE_SHA256: undefined,
        NEXT_PUBLIC_MUZA_RELEASE_SIZE: undefined,
      }),
      { kind: "preparing", repositoryUrl: REPOSITORY_URL },
    );
  });

  test("every non-empty partial subset rejects", () => {
    for (let mask = 1; mask < 0b1111; mask += 1) {
      const partial: Partial<Record<(typeof ENV_KEYS)[number], string>> = {};
      for (let index = 0; index < ENV_KEYS.length; index += 1) {
        if ((mask & (1 << index)) !== 0) {
          const key = ENV_KEYS[index];
          partial[key] = CANONICAL_ENV[key];
        }
      }
      assert.throws(() => parseLandingRelease(partial), `partial mask ${mask.toString(2)}`);
    }
  });

  test("empty and whitespace values reject", () => {
    assert.throws(() =>
      parseLandingRelease({
        NEXT_PUBLIC_MUZA_RELEASE_TAG: "",
        NEXT_PUBLIC_MUZA_RELEASE_URL: "",
        NEXT_PUBLIC_MUZA_RELEASE_SHA256: "",
        NEXT_PUBLIC_MUZA_RELEASE_SIZE: "",
      }),
    );
    for (const key of ENV_KEYS) {
      assert.throws(() => parseLandingRelease(configured({ [key]: " \t" })));
    }
  });

  test("canonical full configuration returns the exact available union", () => {
    assert.deepEqual(parseLandingRelease(CANONICAL_ENV), {
      kind: "available",
      repositoryUrl: REPOSITORY_URL,
      tag: TAG,
      downloadUrl: DOWNLOAD_URL,
      sha256: SHA256,
      sizeBytes: 73_400_320,
    });
    assert.equal(formatReleaseSize(73_400_320), "70 МБ");
    assert.equal(abbreviateSha256(SHA256), "0123456789ab…");
  });

  test("tag grammar is stable ASCII semver without leading zero or suffix", () => {
    assert.doesNotThrow(() =>
      parseLandingRelease(
        configured({
          NEXT_PUBLIC_MUZA_RELEASE_TAG: "v99999.99999.99999",
          NEXT_PUBLIC_MUZA_RELEASE_URL: urlFor("v99999.99999.99999"),
        }),
      ),
    );
    for (const tag of [
      "1.2.3",
      "v1.2",
      "v1.2.3.4",
      "v01.2.3",
      "v1.02.3",
      "v1.2.03",
      "v1.2.3-alpha",
      "v1.2.3+build",
      "v100000.0.0",
      "v1.2.три",
    ]) {
      assert.throws(() =>
        parseLandingRelease(
          configured({
            NEXT_PUBLIC_MUZA_RELEASE_TAG: tag,
            NEXT_PUBLIC_MUZA_RELEASE_URL: urlFor(tag),
          }),
        ),
      );
    }
  });

  test("SHA-256 is exactly 64 lowercase hexadecimal characters", () => {
    for (const sha256 of [SHA256.toUpperCase(), SHA256.slice(1), `${SHA256}0`, `${SHA256.slice(0, -1)}g`]) {
      assert.throws(() =>
        parseLandingRelease(configured({ NEXT_PUBLIC_MUZA_RELEASE_SHA256: sha256 })),
      );
    }
  });

  test("size is a positive canonical safe decimal integer", () => {
    assert.equal(
      parseLandingRelease(configured({ NEXT_PUBLIC_MUZA_RELEASE_SIZE: "9007199254740991" })).kind,
      "available",
    );
    for (const size of ["0", "-1", " 1", "1 ", "+1", "01", "1e6", "9007199254740992"]) {
      assert.throws(() => parseLandingRelease(configured({ NEXT_PUBLIC_MUZA_RELEASE_SIZE: size })));
    }
  });

  test("URL rejects foreign, uppercase, non-HTTPS, userinfo and port variants", () => {
    for (const url of [
      DOWNLOAD_URL.replace("github.com", "evil.test"),
      DOWNLOAD_URL.replace("github.com", "GitHub.com"),
      DOWNLOAD_URL.replace("EntonioDMI", "SomeoneElse"),
      DOWNLOAD_URL.replace("muza-client", "Muza-client"),
      DOWNLOAD_URL.replace("https://", "http://"),
      DOWNLOAD_URL.replace("https://", "https://user@"),
      DOWNLOAD_URL.replace("https://", "https://@"),
      DOWNLOAD_URL.replace("github.com", "github.com:443"),
    ]) {
      assert.throws(() => parseLandingRelease(configured({ NEXT_PUBLIC_MUZA_RELEASE_URL: url })));
    }
  });

  test("URL rejects query and fragment markers even when empty", () => {
    for (const suffix of ["?download=1", "?", "#asset", "#"]) {
      assert.throws(() =>
        parseLandingRelease(
          configured({ NEXT_PUBLIC_MUZA_RELEASE_URL: `${DOWNLOAD_URL}${suffix}` }),
        ),
      );
    }
  });

  test("URL rejects tag mismatch, normalized paths and extra segments", () => {
    for (const url of [
      urlFor("v1.2.4"),
      DOWNLOAD_URL.replace("/download/v1.2.3/", "/download/./v1.2.3/"),
      DOWNLOAD_URL.replace("/download/v1.2.3/", "/download//v1.2.3/"),
      DOWNLOAD_URL.replace("/download/v1.2.3/", "/download/%76%31%2E%32%2E%33/"),
      DOWNLOAD_URL.replace(`/${ASSET}`, `/extra/${ASSET}`),
      DOWNLOAD_URL.replace(`/${ASSET}`, `/%2e/${ASSET}`),
    ]) {
      assert.throws(() => parseLandingRelease(configured({ NEXT_PUBLIC_MUZA_RELEASE_URL: url })));
    }
  });

  test("URL accepts only one safe 5-128 character exe asset segment", () => {
    const longest = `${"A".repeat(124)}.exe`;
    assert.doesNotThrow(() =>
      parseLandingRelease(configured({ NEXT_PUBLIC_MUZA_RELEASE_URL: urlFor(TAG, longest) })),
    );
    for (const asset of [
      ".exe",
      "-Muza.exe",
      "Muza setup.exe",
      "Muza%20setup.exe",
      "Muza.zip",
      "Muza.exe.sig",
      `${"A".repeat(125)}.exe`,
      "Muza/Setup.exe",
    ]) {
      assert.throws(() =>
        parseLandingRelease(configured({ NEXT_PUBLIC_MUZA_RELEASE_URL: urlFor(TAG, asset) })),
      );
    }
  });
});
