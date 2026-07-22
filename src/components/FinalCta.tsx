import { Download, Globe } from "lucide-react";
import {
  abbreviateSha256,
  formatReleaseSize,
  REPOSITORY_RELEASES_URL,
  WEB_APP_URL,
  type LandingRelease,
} from "@/lib/release";
import GitHubMark from "./GitHubMark";
import Reveal from "./Reveal";
import s from "./FinalCta.module.css";

export default function FinalCta({ release }: { release: LandingRelease }) {
  return (
    <section className={`container ${s.section}`}>
      {/* Гигантский фирменный глиф — плоский силуэт слоем surface, без градиентов */}
      <div className={s.glyphBg} aria-hidden="true" />
      <Reveal>
        <h2 className={s.title}>Слушай без ограничений</h2>
      </Reveal>
      <Reveal delay={80} className={s.actions}>
        {release.kind === "available" ? (
          <a className={`btn btn-accent ${s.cta}`} href={release.downloadUrl}>
            <Download strokeWidth={1.75} className={s.icon} aria-hidden="true" />
            {`Скачать Muza ${release.tag}`}
          </a>
        ) : (
          <>
            {/* Пока релиза нет, акцент — у настоящего продуктового действия */}
            <a className={`btn btn-accent ${s.cta}`} href={WEB_APP_URL}>
              <Globe strokeWidth={1.75} className={s.icon} aria-hidden="true" />
              Открыть в браузере
            </a>
            <a
              className={`btn btn-surface ${s.cta}`}
              href={REPOSITORY_RELEASES_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <GitHubMark className={s.icon} />
              Следить на GitHub
            </a>
          </>
        )}
      </Reveal>
      <Reveal delay={140}>
        <p className={s.note}>
          {release.kind === "available"
            ? `${formatReleaseSize(release.sizeBytes)} · SHA-256 ${abbreviateSha256(release.sha256)}`
            : "Чтобы узнать о релизе первым — в репозитории нажми Watch → Custom → Releases"}
        </p>
      </Reveal>
    </section>
  );
}
