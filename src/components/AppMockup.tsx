"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Heart,
  Home,
  LibraryBig,
  MicVocal,
  Minus,
  Moon,
  Pause,
  Play,
  Search,
  SkipBack,
  SkipForward,
  Square,
  Volume2,
  X,
} from "lucide-react";
import { DEMO_TRACKS, EXTRA_ROW, formatTime } from "@/lib/demo";
import s from "./AppMockup.module.css";

/** Длительность «трека» в демо-цикле, сек */
const TRACK_SEC = 14;
/** Шаг тика, сек */
const TICK = 0.25;

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

export default function AppMockup() {
  const reduced = usePrefersReducedMotion();
  // стартуем с середины «трека», чтобы сцена сразу выглядела живой
  const [elapsed, setElapsed] = useState(TRACK_SEC * 0.35);

  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => setElapsed((v) => v + TICK), TICK * 1000);
    return () => clearInterval(id);
  }, [reduced]);

  const trackIdx = Math.floor(elapsed / TRACK_SEC) % DEMO_TRACKS.length;
  const prevIdx = (trackIdx - 1 + DEMO_TRACKS.length) % DEMO_TRACKS.length;
  const progress = (elapsed % TRACK_SEC) / TRACK_SEC;
  const track = DEMO_TRACKS[trackIdx];

  const activeLine = useMemo(() => {
    let idx = 0;
    for (let i = 0; i < track.lines.length; i++) {
      if (track.lines[i].t <= progress) idx = i;
    }
    return idx;
  }, [track, progress]);

  const paused = reduced;

  return (
    <div className={s.mockup} aria-hidden="true">
      <div className={s.window}>
        {/* Заголовок окна */}
        <div className={s.titlebar}>
          <span className={s.brand}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo/glyph.svg" alt="" className={s.glyph} />
            <span className={s.wordmark}>Muza</span>
          </span>
          <span className={s.winControls}>
            <Minus strokeWidth={1.75} />
            <Square strokeWidth={1.75} className={s.winSquare} />
            <X strokeWidth={1.75} />
          </span>
        </div>

        {/* Три зоны, разделённые жёлобом фона */}
        <div className={s.zones}>
          <aside className={s.sidebar}>
            <div className={`${s.navItem} ${s.navActive}`}>
              <Home strokeWidth={1.75} />
              <span>Главная</span>
            </div>
            <div className={s.navItem}>
              <Search strokeWidth={1.75} />
              <span>Поиск</span>
            </div>
            <div className={s.navItem}>
              <LibraryBig strokeWidth={1.75} />
              <span>Библиотека</span>
            </div>
            <div className={s.navItem}>
              <Heart strokeWidth={1.75} />
              <span>Любимое</span>
            </div>
            <div className={s.sideCaption}>Плейлисты</div>
            <div className={s.sideLink}>Для сна</div>
            <div className={s.sideLink}>В дорогу</div>
          </aside>

          <section className={s.main}>
            <div className={s.greeting}>Добрый вечер</div>
            <div className={s.rows}>
              {DEMO_TRACKS.map((t, i) => (
                <div
                  key={t.id}
                  className={`${s.row} ${i === trackIdx ? s.rowActive : ""}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.cover} alt="" className={s.rowCover} />
                  <span className={s.rowMeta}>
                    <span className={s.rowTitle}>{t.title}</span>
                    <span className={s.rowArtist}>{t.artist}</span>
                  </span>
                  {i === trackIdx ? (
                    <span className={s.playingBars}>
                      <i />
                      <i />
                      <i />
                    </span>
                  ) : (
                    <span className={s.rowTime}>{formatTime(t.durationSec)}</span>
                  )}
                </div>
              ))}
              <div className={s.row}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={EXTRA_ROW.cover} alt="" className={s.rowCover} />
                <span className={s.rowMeta}>
                  <span className={s.rowTitle}>{EXTRA_ROW.title}</span>
                  <span className={s.rowArtist}>{EXTRA_ROW.artist}</span>
                </span>
                <span className={s.rowTime}>{formatTime(EXTRA_ROW.durationSec)}</span>
              </div>
            </div>
            <div className={s.shelfCaption}>Собрано для тебя</div>
            <div className={s.tiles}>
              {[
                { cover: "/covers/cover-2.png", name: "Вечерний дрейф" },
                { cover: "/covers/cover-5.png", name: "Энергия" },
                { cover: "/covers/cover-7.png", name: "Фокус" },
                { cover: "/covers/cover-8.png", name: "Дождь и неон" },
              ].map((p) => (
                <div key={p.name} className={s.tile}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.cover} alt="" className={s.tileCover} />
                  <span className={s.tileName}>{p.name}</span>
                </div>
              ))}
            </div>
          </section>

          <aside className={s.nowPlaying}>
            <div className={s.npCoverBox}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={DEMO_TRACKS[prevIdx].cover} alt="" className={s.npCoverPrev} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img key={track.id} src={track.cover} alt="" className={s.npCover} />
            </div>
            <div className={s.npTitle} key={`t-${track.id}`}>
              {track.title}
            </div>
            <div className={s.npArtist}>{track.artist}</div>
            <div className={s.lyricsBox}>
              <div
                className={s.lyricsRoll}
                style={{ transform: `translateY(calc(var(--slot) * ${2 - activeLine}))` }}
              >
                {track.lines.map((l, i) => {
                  const d = Math.min(Math.abs(i - activeLine), 2);
                  return (
                    <div key={`${track.id}-${i}`} className={s.lyricLine} data-dist={d}>
                      {l.text}
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>

        {/* Плеер-бар — матовое стекло */}
        <div className={s.playerBar}>
          <div className={s.pbInfo}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img key={track.id} src={track.cover} alt="" className={s.pbCover} />
            <span className={s.pbMeta}>
              <span className={s.pbTitle}>{track.title}</span>
              <span className={s.pbArtist}>{track.artist}</span>
            </span>
            <Heart strokeWidth={1.75} className={s.pbHeart} />
          </div>

          <div className={s.pbCenter}>
            <div className={s.pbControls}>
              <SkipBack strokeWidth={1.75} className={s.pbSkip} />
              <span className={s.pbPlay}>
                {paused ? (
                  <Play strokeWidth={1.75} fill="currentColor" />
                ) : (
                  <Pause strokeWidth={1.75} fill="currentColor" />
                )}
              </span>
              <SkipForward strokeWidth={1.75} className={s.pbSkip} />
            </div>
            <div className={s.pbProgressRow}>
              <span className={s.pbTime}>{formatTime(progress * track.durationSec)}</span>
              <span className={s.pbTrack}>
                <span className={s.pbFill} style={{ width: `${progress * 100}%` }} />
              </span>
              <span className={s.pbTime}>{formatTime(track.durationSec)}</span>
            </div>
          </div>

          <div className={s.pbRight}>
            <MicVocal strokeWidth={1.75} className={s.pbLyricsOn} />
            <Moon strokeWidth={1.75} />
            <Volume2 strokeWidth={1.75} />
            <span className={s.eq}>
              <i />
              <i />
              <i />
              <i />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
