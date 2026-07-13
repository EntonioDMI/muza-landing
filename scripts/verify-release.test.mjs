import assert from "node:assert/strict";
import { after, describe, test } from "node:test";

const originalFetch = globalThis.fetch;
let unexpectedNetworkCalls = 0;
globalThis.fetch = async () => {
  unexpectedNetworkCalls += 1;
  throw new Error("unexpected real network");
};

const { verifyRelease } = await import("./verify-release.mjs");

after(() => {
  globalThis.fetch = originalFetch;
});

const TAG = "v1.2.3";
const DOWNLOAD_URL =
  "https://github.com/EntonioDMI/muza-client/releases/download/v1.2.3/Muza_1.2.3_x64-setup.exe";
const SHA256 = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const SIZE = 73_400_320;
const API_URL = "https://api.github.com/repos/EntonioDMI/muza-client/releases/tags/v1.2.3";

const AVAILABLE_ENV = Object.freeze({
  NEXT_PUBLIC_MUZA_RELEASE_TAG: TAG,
  NEXT_PUBLIC_MUZA_RELEASE_URL: DOWNLOAD_URL,
  NEXT_PUBLIC_MUZA_RELEASE_SHA256: SHA256,
  NEXT_PUBLIC_MUZA_RELEASE_SIZE: String(SIZE),
});

function releaseBody(assetOverrides = {}, releaseOverrides = {}) {
  return {
    tag_name: TAG,
    draft: false,
    prerelease: false,
    assets: [
      {
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

describe("verifyRelease", () => {
  test("import is side-effect free", () => {
    assert.equal(typeof verifyRelease, "function");
    assert.equal(unexpectedNetworkCalls, 0);
  });

  test("preparing performs zero fetches", async () => {
    let calls = 0;
    const result = await verifyRelease({
      env: {},
      fetchImpl: async () => {
        calls += 1;
        throw new Error("fetch must not run");
      },
    });
    assert.deepEqual(result, {
      kind: "preparing",
      repositoryUrl: "https://github.com/EntonioDMI/muza-client",
    });
    assert.equal(calls, 0);
  });

  test("partial and invalid configuration reject before I/O", async () => {
    for (const env of [
      { NEXT_PUBLIC_MUZA_RELEASE_TAG: TAG },
      { ...AVAILABLE_ENV, NEXT_PUBLIC_MUZA_RELEASE_SHA256: SHA256.toUpperCase() },
    ]) {
      let calls = 0;
      await assert.rejects(() =>
        verifyRelease({
          env,
          fetchImpl: async () => {
            calls += 1;
            throw new Error("fetch must not run");
          },
        }),
      );
      assert.equal(calls, 0);
    }
  });

  test("available performs one exact GitHub API request with bounded headers", async () => {
    const calls = [];
    const result = await verifyRelease({
      env: AVAILABLE_ENV,
      fetchImpl: async (...args) => {
        calls.push(args);
        return response(
          releaseBody(
            {},
            {
              assets: [
                { browser_download_url: "https://example.test/unrelated.zip" },
                releaseBody().assets[0],
              ],
            },
          ),
        );
      },
    });

    assert.deepEqual(result, {
      kind: "available",
      repositoryUrl: "https://github.com/EntonioDMI/muza-client",
      tag: TAG,
      downloadUrl: DOWNLOAD_URL,
      sha256: SHA256,
      sizeBytes: SIZE,
    });
    assert.equal(calls.length, 1);
    assert.equal(calls[0][0], API_URL);
    assert.deepEqual(calls[0][1].headers, {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "muza-landing-release-verifier",
    });
    assert.ok(calls[0][1].signal instanceof AbortSignal);
    assert.equal(unexpectedNetworkCalls, 0);
  });

  test("non-2xx and invalid JSON reject", async () => {
    await assert.rejects(() =>
      verifyRelease({
        env: AVAILABLE_ENV,
        fetchImpl: async () => response({}, { ok: false, status: 404 }),
      }),
    );
    await assert.rejects(() =>
      verifyRelease({
        env: AVAILABLE_ENV,
        fetchImpl: async () => response(null, { jsonError: new SyntaxError("bad json") }),
      }),
    );
  });

  test("JSON must be a release object with exact public tag flags and assets", async () => {
    for (const body of [
      null,
      [],
      "release",
      releaseBody({}, { tag_name: "v1.2.4" }),
      releaseBody({}, { draft: true }),
      releaseBody({}, { draft: undefined }),
      releaseBody({}, { prerelease: true }),
      releaseBody({}, { prerelease: undefined }),
      releaseBody({}, { assets: undefined }),
      releaseBody({}, { assets: {} }),
    ]) {
      await assert.rejects(() =>
        verifyRelease({
          env: AVAILABLE_ENV,
          fetchImpl: async () => response(body),
        }),
      );
    }
  });

  test("exactly one asset may match the configured browser URL", async () => {
    for (const assets of [
      [],
      [{ browser_download_url: "https://example.test/other.exe" }],
      [releaseBody().assets[0], { ...releaseBody().assets[0] }],
    ]) {
      await assert.rejects(() =>
        verifyRelease({
          env: AVAILABLE_ENV,
          fetchImpl: async () => response(releaseBody({}, { assets })),
        }),
      );
    }
  });

  test("matching asset must be uploaded with exact numeric size and lowercase digest", async () => {
    for (const assetOverrides of [
      { state: "new" },
      { state: undefined },
      { size: SIZE + 1 },
      { size: String(SIZE) },
      { digest: `sha256:${SHA256.toUpperCase()}` },
      { digest: SHA256 },
      { digest: undefined },
    ]) {
      await assert.rejects(() =>
        verifyRelease({
          env: AVAILABLE_ENV,
          fetchImpl: async () => response(releaseBody(assetOverrides)),
        }),
      );
    }
  });

  test("fully matching uploaded public asset succeeds", async () => {
    let calls = 0;
    const result = await verifyRelease({
      env: AVAILABLE_ENV,
      fetchImpl: async () => {
        calls += 1;
        return response(releaseBody());
      },
    });
    assert.equal(calls, 1);
    assert.equal(result.kind, "available");
    assert.equal(result.downloadUrl, DOWNLOAD_URL);
    assert.equal(unexpectedNetworkCalls, 0);
  });
});
