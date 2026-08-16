import { Download, Globe } from "lucide-react";
import {
  abbreviateSha256,
  formatReleaseSize,
  REPOSITORY_RELEASES_URL,
  WEB_APP_URL,
  type LandingRelease,
} from "@/lib/release";
import AppMockup from "./AppMockup";
import GitHubMark from "./GitHubMark";
import s from "./Hero.module.css";

export default function Hero({ release }: { release: LandingRelease }) {
  return (
    <section className={s.hero} id="top">
      <h1 className={s.title}>
        Музыка <span className={s.titleAccent}>без блюра</span>
      </h1>
      <p className={s.sub}>
        Muza — бесплатный плеер для Windows. Тексты песен целиком — без
        звёздочек и приглушённых слов, синхронно с треком. Умная очередь и
        звук, который подстраивается под тебя.
      </p>
      <div className={s.actions}>
        {release.kind === "available" ? (
          <a className="btn btn-accent" href={release.downloadUrl}>
            <Download strokeWidth={1.75} className={s.btnIcon} aria-hidden="true" />
            {`Скачать Muza ${release.tag}`}
          </a>
        ) : (
          <span className={s.status}>Первый релиз готовится</span>
        )}
        {/* Пока релиза нет, у страницы должно остаться главное действие:
            веб-версия — единственное настоящее продуктовое действие */}
        <a
          className={release.kind === "available" ? "btn btn-surface" : "btn btn-accent"}
          href={WEB_APP_URL}
        >
          <Globe strokeWidth={1.75} className={s.btnIcon} aria-hidden="true" />
          Открыть в браузере
        </a>
        <a
          className="btn btn-surface"
          href={release.kind === "available" ? release.repositoryUrl : REPOSITORY_RELEASES_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          <GitHubMark className={s.btnIcon} />
          {release.kind === "available" ? "Исходники" : "Следить за релизом на GitHub"}
        </a>
      </div>
      <p className={s.note}>
        {release.kind === "available"
          ? `${formatReleaseSize(release.sizeBytes)} · SHA-256 ${abbreviateSha256(release.sha256)}`
          : "Windows 10/11 · без подписок и рекламы"}
      </p>
      {/* ⚠️ Предупреждение SmartScreen объявлено ЗДЕСЬ, у самой кнопки, а не в
          FAQ внизу: это крупнейшее трение всего пути, и человек встречает его
          через секунду после клика. До 15.08 о нём не было ни слова на всём
          сайте — страница обещала лёгкий старт, которого нет. Платная подпись
          отклонена владельцем 22.07 осознанно; осознанная цена должна быть
          названа, а не проглочена за человека. Отсылка к SHA-256 выше не
          украшение: это единственный способ проверить файл, который у него есть. */}
      {release.kind === "available" ? (
        <p className={s.warn}>
          Windows покажет «Неизвестный издатель»: у сборки нет платной подписи.
          Нажми «Подробнее» и «Выполнить в любом случае». Файл можно сверить по SHA-256 выше.
        </p>
      ) : null}
      <div className={s.mockupSlot}>
        <AppMockup />
      </div>
    </section>
  );
}
