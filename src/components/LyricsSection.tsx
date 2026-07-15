"use client";

import { useEffect, useRef, useState } from "react";
import Reveal from "./Reveal";
import s from "./LyricsSection.module.css";

/* Секция ведёт себя как караоке-режим приложения:
   строки-тезисы подсвечиваются по мере скролла. */

const LINES = [
  "Тексты целиком",
  "Без звёздочек и блюра",
  "Синхронно с треком",
  "Крупно, на весь экран",
  "Как задумал артист",
];

export default function LyricsSection() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = trackRef.current;
        if (!el) return;
        const total = el.offsetHeight - window.innerHeight;
        const p = Math.min(1, Math.max(0, -el.getBoundingClientRect().top / total));
        setActive(Math.min(LINES.length - 1, Math.floor(p * LINES.length)));
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

  return (
    <section className={s.section} id="lyrics">
      {/* Заголовок флагманской секции — вне видимой сцены (караоке говорит само),
          но в outline документа: скринридеры, сканирование, SEO */}
      <h2 className="visually-hidden">Тексты песен — целиком и синхронно с треком</h2>
      {/* «Трек» задаёт длину скролла; sticky-экран липнет внутри него,
          поэтому аутро ниже никогда не наезжает на строки */}
      <div ref={trackRef} className={s.track}>
        <div className={s.sticky}>
          <div className={s.caption}>Сейчас играет</div>
          <div className={s.lines}>
            {LINES.map((line, i) => {
              const d = Math.min(Math.abs(i - active), 2);
              return (
                <div key={line} className={s.line} data-dist={d}>
                  {line}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className={s.outro}>
        <Reveal>
          <p className={s.outroText}>
            Muza показывает текст так, как он написан: активная строка всегда по
            центру, соседние — тише. Полноэкранный режим прослушивания
            превращает трек в караоке, а режим смысла объясняет строки, за
            которыми стоит больше, чем кажется.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
