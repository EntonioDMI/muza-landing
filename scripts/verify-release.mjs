import { pathToFileURL } from "node:url";
import { parseLandingRelease } from "../src/lib/release.ts";

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** «Релиз готовится» — правда ТОЛЬКО пока стабильного релиза нет.
 *
 *  ⚠️ ЗАЧЕМ ЭТА ПРОВЕРКА. До 15.08 гейт на `preparing` возвращался сразу и не
 *  смотрел никуда. Значит сборка без четырёх `NEXT_PUBLIC_MUZA_RELEASE_*`
 *  проходила молча — и выкладывала страницу, которая при ТРИНАДЦАТИ
 *  опубликованных релизах пишет «Первый релиз готовится», прячет кнопку
 *  скачивания, делает единственной акцентной кнопкой «Открыть в браузере» — и
 *  в шестнадцати пикселях под ней сообщает «Windows 10/11». Плюс плашки
 *  продолжают обещать эквалайзер, Discord, сон-таймер и свой CSS, которых в
 *  вебе нет. Это нарушение железного правила публичных поверхностей целым
 *  СОСТОЯНИЕМ страницы, а не формулировкой, и заметить его глазами нельзя:
 *  именно оно закоммичено в репозиторий.
 *
 *  Асимметрия намеренная: `available` доказывает, что релиз ЕСТЬ, а `preparing`
 *  теперь доказывает, что его НЕТ. Раньше вторую половину никто не доказывал.
 *
 *  Отказ сети сборку НЕ роняет: недоступный GitHub — не повод считать, что
 *  релиза нет, а `preparing` без релиза остаётся законным состоянием. Роняем
 *  только на однозначном «релиз есть». */
async function verifyPreparingIsHonest({ release, fetchImpl }) {
  if (typeof fetchImpl !== "function") return release;
  let response;
  try {
    response = await fetchImpl("https://api.github.com/repos/EntonioDMI/muza-client/releases/latest", {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "muza-landing-release-verifier",
      },
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    return release; // сети нет — молчим, см. выше
  }
  if (!isRecord(response)) return release;
  if (response.status === 404) return release; // стабильного релиза правда нет
  if (response.ok !== true) return release; // лимит API, 5xx — не наше дело
  let payload;
  try {
    payload = await response.json();
  } catch {
    return release;
  }
  if (!isRecord(payload) || typeof payload.tag_name !== "string") return release;
  throw new Error(
    `release ${payload.tag_name} is published, but the four NEXT_PUBLIC_MUZA_RELEASE_* vars are missing — ` +
      `the page would say "первый релиз готовится" and hide the download button`,
  );
}

export async function verifyRelease({ env, fetchImpl }) {
  const release = parseLandingRelease(env);
  if (release.kind === "preparing") return verifyPreparingIsHonest({ release, fetchImpl });
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
