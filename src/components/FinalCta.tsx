import { Download } from "lucide-react";
import Reveal from "./Reveal";
import s from "./FinalCta.module.css";

const RELEASES = "https://github.com/EntonioDMI/muza-client/releases/latest";

export default function FinalCta() {
  return (
    <section className={`container ${s.section}`}>
      <Reveal>
        <h2 className={s.title}>Слушай без ограничений</h2>
      </Reveal>
      <Reveal delay={80}>
        <a className={`btn btn-accent ${s.cta}`} href={RELEASES}>
          <Download strokeWidth={1.75} className={s.icon} />
          Скачать для Windows
        </a>
      </Reveal>
      <Reveal delay={140}>
        <p className={s.note}>Windows 10/11 · свежая сборка на GitHub Releases</p>
      </Reveal>
    </section>
  );
}
