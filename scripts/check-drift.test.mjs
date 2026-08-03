import assert from "node:assert/strict";
import { after, describe, test } from "node:test";

const originalFetch = globalThis.fetch;
let unexpectedNetworkCalls = 0;
globalThis.fetch = async () => {
  unexpectedNetworkCalls += 1;
  throw new Error("unexpected real network");
};

const {
  checkDrift,
  compareRelease,
  compareWebClient,
  readCommitPosition,
  readLandingPage,
  readLatestRelease,
  readWebClientStamp,
} = await import("./check-drift.mjs");

after(() => {
  globalThis.fetch = originalFetch;
});

const LANDING_URL = "https://muza.lol/";
const API_URL = "https://api.github.com/repos/EntonioDMI/muza-client/releases/latest";
const STAMP_URL = "https://app.muza.lol/build-stamp.json";
const COMPARE_URL = "https://api.github.com/repos/EntonioDMI/muza-client/compare/main...";
const WEB_COMMIT = "4f0a91c2b7de3915608a4cd2ffb1e70a9c53d8b6";

// Настоящие значения 15.07.2026: прод отдавал v0.1.2, Latest был уже v0.1.3.
const OLD_TAG = "v0.1.2";
const OLD_SHA12 = "359adbfeec18";
const NEW_TAG = "v0.1.3";
const NEW_SHA = "37e2e93f46e90ae25b2ddae57d395a3fd0b0637d49daddad53ae21ebdcd4ea74";

function page({ tag = NEW_TAG, sha12 = NEW_SHA.slice(0, 12) } = {}) {
  return `<!doctype html><html><body>
    <a href="https://github.com/EntonioDMI/muza-client/releases/download/${tag}/Muza_x64-setup.exe">Скачать Muza ${tag}</a>
    <p>52,1 МБ · SHA-256 ${sha12}…</p>
  </body></html>`;
}

const PREPARING_PAGE = `<!doctype html><html><body><p>Скоро</p></body></html>`;

function releaseBody(overrides = {}) {
  return {
    tag_name: NEW_TAG,
    assets: [
      { name: "Muza_0.1.3_x64-setup.exe", digest: `sha256:${NEW_SHA}` },
      { name: "Muza_0.1.3_x64-setup.exe.sig", digest: "sha256:beef" },
      { name: "latest.json", digest: "sha256:cafe" },
    ],
    ...overrides,
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
    async text() {
      return typeof body === "string" ? body : "";
    },
  };
}

// Штамп веб-клиента: собран из чистого дерева, с боевым адресом API, на коммите из main.
function stampBody(overrides = {}) {
  return {
    commit: WEB_COMMIT,
    ref: "v0.1.3-4-g4f0a91c",
    dirty: false,
    api: "https://api.muza.lol/api",
    ...overrides,
  };
}

function routed({ release = releaseBody(), html = page(), stamp = stampBody(), position = "behind", calls } = {}) {
  return async (url, init) => {
    calls?.push([url, init]);
    if (url === API_URL) return response(release);
    if (url === LANDING_URL) return response(html);
    if (url === STAMP_URL) {
      if (stamp === null) return response("", { ok: false, status: 404 });
      return response(typeof stamp === "string" ? stamp : JSON.stringify(stamp));
    }
    if (url.startsWith(COMPARE_URL)) return response({ status: position });
    throw new Error(`unrouted url ${url}`);
  };
}

describe("compareRelease", () => {
  test("import is side-effect free", () => {
    assert.equal(typeof checkDrift, "function");
    assert.equal(unexpectedNetworkCalls, 0);
  });

  test("matching tag and signature prefix is current", () => {
    const result = compareRelease({ tag: NEW_TAG, sha256: NEW_SHA }, { tag: NEW_TAG, sha256: NEW_SHA.slice(0, 12) });
    assert.equal(result.drifted, false);
    assert.match(result.reason, /matching the published release/);
  });

  test("the 2026-07-15 regression: page one release behind is drift", () => {
    const result = compareRelease({ tag: NEW_TAG, sha256: NEW_SHA }, { tag: OLD_TAG, sha256: OLD_SHA12 });
    assert.equal(result.drifted, true);
    assert.match(result.reason, /advertises v0\.1\.2, latest release is v0\.1\.3/);
  });

  test("same tag with a re-uploaded asset is drift", () => {
    const result = compareRelease({ tag: NEW_TAG, sha256: NEW_SHA }, { tag: NEW_TAG, sha256: OLD_SHA12 });
    assert.equal(result.drifted, true);
    assert.match(result.reason, /359adbfeec18…, release asset is 37e2e93f46e9…/);
  });

  test("page without any download while a release exists is drift", () => {
    for (const p of [{ tag: null, sha256: OLD_SHA12 }, { tag: OLD_TAG, sha256: null }, { tag: null, sha256: null }]) {
      const result = compareRelease({ tag: NEW_TAG, sha256: NEW_SHA }, p);
      assert.equal(result.drifted, true);
      assert.match(result.reason, /advertises no download/);
    }
  });
});

describe("readLatestRelease and readLandingPage", () => {
  test("release request is exact and bounded, .sig and .json are not installers", async () => {
    const calls = [];
    const result = await readLatestRelease(routed({ calls }));
    assert.deepEqual(result, { tag: NEW_TAG, sha256: NEW_SHA });
    assert.equal(calls.length, 1);
    assert.equal(calls[0][0], API_URL);
    assert.deepEqual(calls[0][1].headers, {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "muza-landing-drift-check",
    });
    assert.ok(calls[0][1].signal instanceof AbortSignal);
  });

  test("non-2xx, invalid JSON and malformed payloads reject", async () => {
    await assert.rejects(() => readLatestRelease(async () => response({}, { ok: false, status: 404 })));
    await assert.rejects(() => readLatestRelease(async () => response(null, { jsonError: new SyntaxError("bad") })));
    for (const body of [null, [], "release", releaseBody({ tag_name: undefined }), releaseBody({ tag_name: "" }), releaseBody({ assets: undefined }), releaseBody({ assets: {} })]) {
      await assert.rejects(() => readLatestRelease(async () => response(body)));
    }
  });

  test("release must carry exactly one .exe with a sha256 digest", async () => {
    for (const assets of [
      [],
      [{ name: "latest.json", digest: "sha256:cafe" }],
      [{ name: "a.exe", digest: `sha256:${NEW_SHA}` }, { name: "b.exe", digest: `sha256:${NEW_SHA}` }],
      [{ name: "a.exe" }],
      [{ name: "a.exe", digest: NEW_SHA }],
      [{ name: "a.exe", digest: `md5:${NEW_SHA}` }],
    ]) {
      await assert.rejects(() => readLatestRelease(async () => response(releaseBody({ assets }))));
    }
  });

  test("landing page yields tag and abbreviated signature", async () => {
    const calls = [];
    const result = await readLandingPage(routed({ calls }));
    assert.deepEqual(result, { tag: NEW_TAG, sha256: NEW_SHA.slice(0, 12) });
    assert.equal(calls[0][0], LANDING_URL);
  });

  test("preparing page yields nulls, empty page rejects", async () => {
    assert.deepEqual(await readLandingPage(routed({ html: PREPARING_PAGE })), { tag: null, sha256: null });
    await assert.rejects(() => readLandingPage(async () => response("")));
    await assert.rejects(() => readLandingPage(async () => response("x", { ok: false, status: 502 })));
  });
});

// Веб-клиент выкладывается на app.muza.lol руками, и до 03.08.2026 у него не было ни
// штампа, ни сверки: собрали из грязного дерева, со старым адресом сервера или с
// коммита, которого нет в main — узнать было неоткуда.
describe("web client build stamp", () => {
  test("a clean build from main is current", () => {
    const result = compareWebClient(stampBody(), "behind");
    assert.equal(result.drifted, false);
    assert.match(result.reason, /runs v0\.1\.3-4-g4f0a91c from main \(behind\)/);
    assert.equal(compareWebClient(stampBody(), "identical").drifted, false);
  });

  test("dirty tree, foreign API url and off-main commit are drift", () => {
    const dirty = compareWebClient(stampBody({ dirty: true }), "behind");
    assert.equal(dirty.drifted, true);
    assert.match(dirty.reason, /uncommitted changes/);

    for (const api of ["http://localhost:8000/api", "https://api.muza.lol", ""]) {
      const wrong = compareWebClient(stampBody({ api }), "behind");
      assert.equal(wrong.drifted, true);
      assert.match(wrong.reason, /expected https:\/\/api\.muza\.lol\/api/);
    }

    for (const position of ["diverged", "ahead", "unknown"]) {
      const off = compareWebClient(stampBody(), position);
      assert.equal(off.drifted, true);
      assert.match(off.reason, new RegExp(`"${position}" against main`));
    }
  });

  test("a site without any stamp is drift, not a failed check", async () => {
    assert.equal(await readWebClientStamp(routed({ stamp: null })), null);
    const result = compareWebClient(null, null);
    assert.equal(result.drifted, true);
    assert.match(result.reason, /publishes no build stamp/);
  });

  test("stamp request is bounded and only 404 is tolerated", async () => {
    const calls = [];
    const stamp = await readWebClientStamp(routed({ calls }));
    assert.deepEqual(stamp, { commit: WEB_COMMIT, ref: "v0.1.3-4-g4f0a91c", dirty: false, api: "https://api.muza.lol/api" });
    assert.equal(calls[0][0], STAMP_URL);
    assert.ok(calls[0][1].signal instanceof AbortSignal);

    for (const status of [500, 502, 403]) {
      await assert.rejects(() => readWebClientStamp(async () => response("", { ok: false, status })));
    }
  });

  test("malformed stamps reject instead of passing silently", async () => {
    for (const stamp of [
      "not json",
      JSON.stringify([]),
      JSON.stringify(stampBody({ commit: undefined })),
      JSON.stringify(stampBody({ commit: "abc" })),
      JSON.stringify(stampBody({ commit: WEB_COMMIT.toUpperCase() })),
      JSON.stringify(stampBody({ dirty: "false" })),
      JSON.stringify(stampBody({ api: undefined })),
    ]) {
      await assert.rejects(() => readWebClientStamp(routed({ stamp })));
    }
  });

  test("commit position comes from the GitHub compare endpoint", async () => {
    const calls = [];
    assert.equal(await readCommitPosition(routed({ calls, position: "behind" }), WEB_COMMIT), "behind");
    assert.equal(calls[0][0], `${COMPARE_URL}${WEB_COMMIT}`);
    await assert.rejects(() => readCommitPosition(async () => response({}), WEB_COMMIT));
    await assert.rejects(() => readCommitPosition(async () => response({ status: "" }), WEB_COMMIT));
    await assert.rejects(() => readCommitPosition(async () => response({}, { ok: false, status: 404 }), WEB_COMMIT));
  });
});

describe("checkDrift", () => {
  test("requires fetchImpl and performs no ambient network", async () => {
    await assert.rejects(() => checkDrift({}));
    assert.equal(unexpectedNetworkCalls, 0);
  });

  test("both current sites report no drift over exactly four requests", async () => {
    const calls = [];
    const result = await checkDrift({ fetchImpl: routed({ calls }) });
    assert.equal(result.drifted, false);
    assert.equal(calls.length, 4);
    assert.match(result.reason, /matching the published release/);
    assert.match(result.reason, /app\.muza\.lol runs/);
    assert.equal(unexpectedNetworkCalls, 0);
  });

  test("stale landing reports drift end to end", async () => {
    const result = await checkDrift({
      fetchImpl: routed({ html: page({ tag: OLD_TAG, sha12: OLD_SHA12 }) }),
    });
    assert.equal(result.drifted, true);
    assert.match(result.reason, /latest release is v0\.1\.3/);
  });

  test("a stale web client alone is enough to report drift", async () => {
    const result = await checkDrift({ fetchImpl: routed({ position: "diverged" }) });
    assert.equal(result.drifted, true);
    assert.match(result.reason, /matching the published release/);
    assert.match(result.reason, /"diverged" against main/);
  });

  test("a missing stamp costs no compare request", async () => {
    const calls = [];
    const result = await checkDrift({ fetchImpl: routed({ calls, stamp: null }) });
    assert.equal(result.drifted, true);
    assert.equal(calls.length, 3);
    assert.equal(calls.filter(([url]) => url.startsWith(COMPARE_URL)).length, 0);
  });
});
