"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Heart,
  Home,
  LibraryBig,
  ListMusic,
  Maximize2,
  MicVocal,
  Moon,
  Pause,
  Play,
  Plus,
  Repeat,
  Search,
  Settings,
  Shuffle,
  SkipBack,
  SkipForward,
  SlidersHorizontal,
  Volume2,
} from "lucide-react";
import { DEMO_TRACKS, EXTRA_TILE, PLAYLISTS, formatTime } from "@/lib/demo";
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
  const rootRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);

  // Демо-цикл живёт только пока мокап в кадре — не жжём CPU под фолдом
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => setInView(entries[0].isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (reduced || !inView) return;
    const id = setInterval(() => setElapsed((v) => v + TICK), TICK * 1000);
    return () => clearInterval(id);
  }, [reduced, inView]);

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
    <div ref={rootRef} className={s.mockup} aria-hidden="true">
      <div className={s.window}>
        <div className={s.zones}>
          {/* Сайдбар — бренд, навигация, плейлисты, настройки */}
          <aside className={s.sidebar}>
            <div className={s.brand}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo/glyph.svg" alt="" className={s.glyph} />
              <span className={s.wordmark}>Muza</span>
            </div>
            <div className={`${s.navItem} ${s.navActive}`}>
              <Home strokeWidth={1.75} />
              <span>Главная</span>
            </div>
            <div className={s.navItem}>
              <Search strokeWidth={1.75} />
              <span>Поиск</span>
            </div>
            <div className={s.navItem}>
              <Heart strokeWidth={1.75} />
              <span>Любимое</span>
            </div>
            <div className={s.navItem}>
              <LibraryBig strokeWidth={1.75} />
              <span>Библиотека</span>
            </div>
            <div className={s.sideCaption}>
              <span>Плейлисты</span>
              <Plus strokeWidth={1.75} />
            </div>
            {PLAYLISTS.map((p) => (
              <div key={p.id} className={s.plRow}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.cover} alt="" className={s.plThumb} />
                <span className={s.plMeta}>
                  <span className={s.plName}>{p.name}</span>
                  <span className={s.plCount}>{p.meta}</span>
                </span>
              </div>
            ))}
            <div className={`${s.navItem} ${s.navSettings}`}>
              <Settings strokeWidth={1.75} />
              <span>Настройки</span>
            </div>
          </aside>

          {/* Центр — приветствие, фильтры, полки плиток */}
          <section className={s.main}>
            <div className={s.greeting}>Добрый вечер</div>
            <div className={s.chips}>
              <span className={`${s.chip} ${s.chipActive}`}>Всё</span>
              <span className={s.chip}>Музыка</span>
              <span className={s.chip}>Плейлисты</span>
              <span className={s.chip}>С текстом</span>
            </div>

            <div className={s.shelfHead}>Продолжить слушать</div>
            <div className={s.tilesScroll}>
              {DEMO_TRACKS.map((t, i) => (
                <div key={t.id} className={s.tile}>
                  <span className={s.tileCoverBox}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={t.cover} alt="" className={s.tileCover} />
                    {i === trackIdx && (
                      <span className={s.tileBadge}>
                        <Pause strokeWidth={1.75} fill="currentColor" />
                      </span>
                    )}
                  </span>
                  <span className={s.tileName}>{t.title}</span>
                  <span className={s.tileSub}>{t.artist}</span>
                </div>
              ))}
              {/* срезанная краем плитка — полка «скроллится», как в приложении */}
              <div className={s.tile} aria-hidden="true">
                <span className={s.tileCoverBox}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={EXTRA_TILE.cover} alt="" className={s.tileCover} />
                </span>
                <span className={s.tileName}>{EXTRA_TILE.title}</span>
                <span className={s.tileSub}>{EXTRA_TILE.artist}</span>
              </div>
            </div>

            <div className={s.shelfHead}>
              <span>Собрано для тебя</span>
              <span className={s.shelfMore}>Показать всё</span>
            </div>
            <div className={s.tiles}>
              {PLAYLISTS.map((p) => (
                <div key={p.id} className={s.tile}>
                  <span className={s.tileCoverBox}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.cover} alt="" className={s.tileCover} />
                  </span>
                  <span className={s.tileName}>{p.name}</span>
                  <span className={s.tileSub}>{p.meta}</span>
                </div>
              ))}
            </div>
          </section>

          {/* «Сейчас играет» — обложка, метаданные, синхротекст */}
          <aside className={s.nowPlaying}>
            <div className={s.npCaption}>Сейчас играет</div>
            <div className={s.npCoverBox}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={DEMO_TRACKS[prevIdx].cover} alt="" className={s.npCoverPrev} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img key={track.id} src={track.cover} alt="" className={s.npCover} />
            </div>
            <div className={s.npTitleRow} key={`t-${track.id}`}>
              <span className={s.npTitle}>{track.title}</span>
              <Heart strokeWidth={1.75} className={s.npHeart} />
            </div>
            <div className={s.npArtist}>
              {track.artist} · {track.album}
            </div>
            <div className={s.lyricsCard}>
              <div className={s.lyricsView}>
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
              <Shuffle strokeWidth={1.75} className={s.pbSide} />
              <SkipBack strokeWidth={1.75} className={s.pbSkip} />
              <span className={s.pbPlay}>
                {paused ? (
                  <Play strokeWidth={1.75} fill="currentColor" />
                ) : (
                  <Pause strokeWidth={1.75} fill="currentColor" />
                )}
              </span>
              <SkipForward strokeWidth={1.75} className={s.pbSkip} />
              <Repeat strokeWidth={1.75} className={s.pbSide} />
            </div>
            <div className={s.pbProgressRow}>
              <span className={s.pbTime}>{formatTime(progress * track.durationSec)}</span>
              <span className={s.pbTrack}>
                <span
                  className={s.pbFill}
                  style={{ transform: `translateX(${(progress - 1) * 100}%)` }}
                />
              </span>
              <span className={s.pbTime}>{formatTime(track.durationSec)}</span>
            </div>
          </div>

          <div className={s.pbRight}>
            <Moon strokeWidth={1.75} />
            <span className={s.pbSpeed}>1×</span>
            <SlidersHorizontal strokeWidth={1.75} />
            <MicVocal strokeWidth={1.75} className={s.pbLyricsOn} />
            <ListMusic strokeWidth={1.75} />
            <Volume2 strokeWidth={1.75} />
            <span className={s.pbVol}>
              <span className={s.pbVolFill} />
            </span>
            <Maximize2 strokeWidth={1.75} />
          </div>
        </div>
      </div>
    </div>
  );
}
