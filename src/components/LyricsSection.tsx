"use client";

import { useEffect, useRef, useState } from "react";
import Reveal from "./Reveal";
import { DEMO_TRACKS, formatTime } from "@/lib/demo";
import s from "./LyricsSection.module.css";

/* Флагманская секция = флагманская фича буквально: полноэкранное караоке
   НАСТОЯЩЕГО демо-трека (тот же каталог, что крутится в мокапе), а не
   лозунги в одежде лирики. Скролл играет трек: активная строка всегда по
   центру (как в приложении), волосок прогресса и время привязаны к нему.
   Трек — «Не глуши мотор»: его строки и есть манифест продукта. */

const TRACK = DEMO_TRACKS[1]; // «Не глуши мотор» — Пламя

export default function LyricsSection() {
  const trackRef = useRef<HTMLDivElement>(null);
  const rollRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [roll, setRoll] = useState(0);

  // Активная строка — по таймингам демо-каталога (t = доля трека), как в приложении
  const active = Math.max(
    0,
    TRACK.lines.reduce((acc, l, i) => (l.t <= progress ? i : acc), 0),
  );

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = trackRef.current;
        if (!el) return;
        const total = el.offsetHeight - window.innerHeight;
        setProgress(Math.min(1, Math.max(0, -el.getBoundingClientRect().top / total)));
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Катим сцену так, чтобы активная строка стояла по центру. Строки переносятся
  // (Unbounded на 375px), поэтому шаг не фиксированный — меряем offsetTop.
  useEffect(() => {
    const measure = () => {
      const line = rollRef.current?.children[active] as HTMLElement | undefined;
      if (line) setRoll(-(line.offsetTop + line.offsetHeight / 2));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [active]);

  return (
    <section className={s.section} id="lyrics">
      <h2 className="visually-hidden">Тексты песен — целиком и синхронно с треком</h2>
      {/* «Трек» задаёт длину скролла; sticky-экран липнет внутри него */}
      <div ref={trackRef} className={s.track}>
        <div className={s.sticky}>
          <div className={s.nowPlaying}>
            {/* Единственный микро-ярлык на лендинге — цитата из UI приложения */}
            <div className={s.caption}>Сейчас играет</div>
            <div className={s.trackRow}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={TRACK.cover} alt="" className={s.cover} />
              <div className={s.trackMeta}>
                <span className={s.trackTitle}>{TRACK.title}</span>
                <span className={s.trackArtist}>{TRACK.artist}</span>
              </div>
            </div>
          </div>
          <div className={s.stage} aria-hidden="true">
            <div ref={rollRef} className={s.roll} style={{ transform: `translateY(${roll}px)` }}>
              {TRACK.lines.map((line, i) => (
                <div key={line.text} className={s.line} data-dist={Math.min(Math.abs(i - active), 3)}>
                  {line.text}
                </div>
              ))}
            </div>
          </div>
          {/* Текст доступен и без сцены — для скринридеров единым блоком */}
          <p className="visually-hidden">{TRACK.lines.map((l) => l.text).join(". ")}</p>
          <div className={s.progress}>
            <span className={s.time}>{formatTime(progress * TRACK.durationSec)}</span>
            <div className={s.bar}>
              <div className={s.fill} style={{ transform: `scaleX(${progress})` }} />
            </div>
            <span className={s.time}>{formatTime(TRACK.durationSec)}</span>
          </div>
        </div>
      </div>
      <div className={s.outro}>
        <Reveal>
          <p className={s.outroText}>
            Это настоящий текст — целиком, без звёздочек и приглушённых слов.
            Активная строка всегда по центру, соседние — тише. Полноэкранный
            режим прослушивания превращает трек в караоке, а режим смысла
            объясняет строки, за которыми стоит больше, чем кажется.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
