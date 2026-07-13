import { Download } from "lucide-react";
import { abbreviateSha256, formatReleaseSize, type LandingRelease } from "@/lib/release";
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
            <span className={`${s.cta} ${s.status}`} role="status" aria-disabled="true">
              Первый релиз готовится
            </span>
            <a
              className={`btn btn-surface ${s.follow}`}
              href={release.repositoryUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Следить за релизом на GitHub
            </a>
          </>
        )}
      </Reveal>
      <Reveal delay={140}>
        <p className={`${s.note} ${release.kind === "available" ? s.metadata : ""}`}>
          {release.kind === "available"
            ? `${formatReleaseSize(release.sizeBytes)} · SHA-256 ${abbreviateSha256(release.sha256)}`
            : "Windows 10/11 · релиз появится на GitHub"}
        </p>
      </Reveal>
    </section>
  );
}
