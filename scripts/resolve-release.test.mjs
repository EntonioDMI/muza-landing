import assert from "node:assert/strict";
import { after, describe, test } from "node:test";

const originalFetch = globalThis.fetch;
let unexpectedNetworkCalls = 0;
globalThis.fetch = async () => {
  unexpectedNetworkCalls += 1;
  throw new Error("unexpected real network");
};

const { resolveLatestRelease, toGithubEnv } = await import("./resolve-release.mjs");

after(() => {
  globalThis.fetch = originalFetch;
});

const TAG = "v1.2.3";
const DOWNLOAD_URL =
  "https://github.com/EntonioDMI/muza-client/releases/download/v1.2.3/Muza_1.2.3_x64-setup.exe";
const SHA256 = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const SIZE = 73_400_320;
const API_URL = "https://api.github.com/repos/EntonioDMI/muza-client/releases/latest";

function releaseBody(assetOverrides = {}, releaseOverrides = {}) {
  return {
    tag_name: TAG,
    draft: false,
    prerelease: false,
    assets: [
      {
        name: "Muza_1.2.3_x64-setup.exe",
        browser_download_url: DOWNLOAD_URL,
        state: "uploaded",
        size: SIZE,
        digest: `sha256:${SHA256}`,
        ...assetOverrides,
      },
    ],
    ...releaseOverrides,
  };
}

function response(body, { ok = true, status = 200, jsonError } = {}) {
  return {
    ok,
    status,
    async json() {
      if (jsonError) throw jsonError;
      return body;
    },
  };
}

function fetchReturning(body, options) {
  return async (url) => {
    assert.equal(url, API_URL);
    return response(body, options);
  };
}

describe("resolveLatestRelease", () => {
  test("возвращает тег, url, sha256 и размер единственного .exe ассета", async () => {
    const release = await resolveLatestRelease({ fetchImpl: fetchReturning(releaseBody()) });
    assert.deepEqual(release, {
      tag: TAG,
      downloadUrl: DOWNLOAD_URL,
      sha256: SHA256,
      sizeBytes: SIZE,
    });
  });

  test("не-exe ассеты (latest.json, .sig) не мешают выбору установщика", async () => {
    const body = releaseBody();
    body.assets.push(
      { name: "latest.json", browser_download_url: "https://x/latest.json", state: "uploaded", size: 1, digest: `sha256:${SHA256}` },
      { name: "Muza_1.2.3_x64-setup.exe.sig", browser_download_url: "https://x/s.sig", state: "uploaded", size: 1, digest: `sha256:${SHA256}` },
    );
    const release = await resolveLatestRelease({ fetchImpl: fetchReturning(body) });
    assert.equal(release.downloadUrl, DOWNLOAD_URL);
  });

  test("двойной .exe — отказ: непонятно, на что вести кнопку", async () => {
    const body = releaseBody();
    body.assets.push({ ...body.assets[0], name: "Muza_1.2.3_arm64-setup.exe" });
    await assert.rejects(
      resolveLatestRelease({ fetchImpl: fetchReturning(body) }),
      /exactly one \.exe asset/,
    );
  });

  test("draft и prerelease — отказ, даже если API их вернул", async () => {
    await assert.rejects(
      resolveLatestRelease({ fetchImpl: fetchReturning(releaseBody({}, { draft: true })) }),
      /not draft/,
    );
    await assert.rejects(
      resolveLatestRelease({ fetchImpl: fetchReturning(releaseBody({}, { prerelease: true })) }),
      /not prerelease/,
    );
  });

  test("недозагруженный ассет, кривой digest, нулевой размер — отказ", async () => {
    await assert.rejects(
      resolveLatestRelease({ fetchImpl: fetchReturning(releaseBody({ state: "starter" })) }),
      /not uploaded/,
    );
    await assert.rejects(
      resolveLatestRelease({ fetchImpl: fetchReturning(releaseBody({ digest: "md5:abc" })) }),
      /sha256 digest/,
    );
    await assert.rejects(
      resolveLatestRelease({ fetchImpl: fetchReturning(releaseBody({ size: 0 })) }),
      /valid size/,
    );
  });

  test("HTTP-ошибка и не-JSON ответ — отказ со статусом/причиной", async () => {
    await assert.rejects(
      resolveLatestRelease({ fetchImpl: fetchReturning(null, { ok: false, status: 403 }) }),
      /status 403/,
    );
    await assert.rejects(
      resolveLatestRelease({ fetchImpl: fetchReturning(null, { jsonError: new Error("bad json") }) }),
      /not valid JSON/,
    );
  });

  test("toGithubEnv печатает ровно четыре NEXT_PUBLIC_MUZA_RELEASE_* строки", () => {
    const lines = toGithubEnv({ tag: TAG, downloadUrl: DOWNLOAD_URL, sha256: SHA256, sizeBytes: SIZE }).split("\n");
    assert.deepEqual(lines, [
      `NEXT_PUBLIC_MUZA_RELEASE_TAG=${TAG}`,
      `NEXT_PUBLIC_MUZA_RELEASE_URL=${DOWNLOAD_URL}`,
      `NEXT_PUBLIC_MUZA_RELEASE_SHA256=${SHA256}`,
      `NEXT_PUBLIC_MUZA_RELEASE_SIZE=${SIZE}`,
    ]);
  });

  test("тесты не сходили в настоящую сеть", () => {
    assert.equal(unexpectedNetworkCalls, 0);
  });
});
