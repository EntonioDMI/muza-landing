"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Pipette, Play } from "lucide-react";
import Reveal from "./Reveal";
import s from "./CustomizeSection.module.css";

/* Живая кастомизация: свотчи/пипетка/пресеты меняют переменные на <html> —
   перекрашивается весь лендинг, включая мокап в герое.
   Деривация оттенков своего цвета — как lib/accent.ts в приложении. */

const ACCENTS = [
  { id: "sky", color: "#3b82f6", label: "Небо" },
  { id: "red", color: "#f76967", label: "Пламя" },
  { id: "bolt", color: "#327ad9", label: "Молния" },
] as const;

const RADII = [
  { id: "mild", label: "Сдержанные" },
  { id: "soft", label: "Мягкие" },
  { id: "round", label: "Круглые" },
] as const;

/** Сдвиг цвета к белому: hover/текстовый оттенок акцента */
function mixWhite(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const m = (c: number) => Math.round(c + (255 - c) * amt);
  return `rgb(${m((n >> 16) & 255)}, ${m((n >> 8) & 255)}, ${m(n & 255)})`;
}

function softOf(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, 0.16)`;
}

export default function CustomizeSection() {
  const [accent, setAccent] = useState<string>("sky");
  const [custom, setCustom] = useState<string | null>(null);
  const [radius, setRadius] = useState<string>("soft");
  const [glass, setGlass] = useState(62);
  const colorRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = document.documentElement;
    if (custom) {
      delete el.dataset.accent;
      el.style.setProperty("--accent", custom);
      el.style.setProperty("--accent-hover", mixWhite(custom, 0.18));
      el.style.setProperty("--accent-text", mixWhite(custom, 0.42));
      el.style.setProperty("--accent-soft", softOf(custom));
    } else {
      for (const p of ["--accent", "--accent-hover", "--accent-text", "--accent-soft"])
        el.style.removeProperty(p);
      if (accent === "sky") delete el.dataset.accent;
      else el.dataset.accent = accent;
    }
    if (radius === "soft") delete el.dataset.radius;
    else el.dataset.radius = radius;
  }, [accent, custom, radius]);

  useEffect(() => {
    const el = document.documentElement;
    if (glass === 62) {
      el.style.removeProperty("--glass-panel");
      el.style.removeProperty("--blur-glass");
    } else {
      el.style.setProperty("--glass-panel", `rgba(23, 22, 20, ${(glass / 100).toFixed(2)})`);
      el.style.setProperty("--blur-glass", `${Math.round(8 + glass * 0.4)}px`);
    }
  }, [glass]);

  return (
    <section className={`container ${s.section}`}>
      <div className={s.cols}>
        <Reveal className={s.colText}>
          <div>
            <h2 className={s.title}>Твоя Muza</h2>
            <p className={s.text}>
              Акцент — хоть фирменный, хоть свой цвет пипеткой. Скругления,
              плотность стекла, фон, собственный CSS и темы из маркетплейса —
              Muza выглядит так, как хочешь ты. Часть можно попробовать прямо
              здесь: сайт перекрасится вместе с мокапом.
            </p>

            <div className={s.groupLabel}>Акцент</div>
            <div className={s.swatches} role="radiogroup" aria-label="Акцентный цвет">
              {ACCENTS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  role="radio"
                  aria-checked={!custom && accent === a.id}
                  aria-label={a.label}
                  className={s.swatch}
                  style={{ background: a.color }}
                  onClick={() => {
                    setCustom(null);
                    setAccent(a.id);
                  }}
                >
                  {!custom && accent === a.id && (
                    <Check strokeWidth={2.5} className={s.swatchCheck} />
                  )}
                </button>
              ))}
              <button
                type="button"
                className={`${s.swatch} ${s.swatchCustom}`}
                style={custom ? { background: custom } : undefined}
                aria-label="Свой цвет"
                onClick={() => colorRef.current?.click()}
              >
                {custom ? (
                  <Check strokeWidth={2.5} className={s.swatchCheck} />
                ) : (
                  <Pipette strokeWidth={1.75} className={s.swatchPipette} />
                )}
              </button>
              <input
                ref={colorRef}
                type="color"
                defaultValue="#8b5cf6"
                className={s.colorInput}
                aria-hidden="true"
                tabIndex={-1}
                onInput={(e) => setCustom((e.target as HTMLInputElement).value)}
              />
            </div>

            <div className={s.groupLabel}>Скругления</div>
            <div className={s.chips} role="radiogroup" aria-label="Пресет скруглений">
              {RADII.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  role="radio"
                  aria-checked={radius === r.id}
                  className={`${s.chip} ${radius === r.id ? s.chipOn : ""}`}
                  onClick={() => setRadius(r.id)}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <div className={s.groupLabel}>Плотность стекла</div>
            <input
              type="range"
              min={30}
              max={90}
              value={glass}
              onChange={(e) => setGlass(Number(e.target.value))}
              className={s.range}
              aria-label="Плотность стекла"
            />

            <div className={s.groupLabel}>А в приложении ещё</div>
            <div className={s.moreChips}>
              <span>Фон</span>
              <span>Свой CSS</span>
              <span>Темы из маркетплейса</span>
            </div>
          </div>
        </Reveal>

        <Reveal delay={80} className={s.colPreview}>
          <div className={s.preview} aria-hidden="true">
            <div className={s.pvTile}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/covers/cover-5.png" alt="" className={s.pvCover} />
              <span className={s.pvPlay}>
                <Play strokeWidth={1.75} fill="currentColor" />
              </span>
              <span className={s.pvName}>Ночной вайб</span>
              <span className={s.pvSub}>42 трека</span>
            </div>
            <div className={s.pvBar}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/covers/cover-3.png" alt="" className={s.pvBarCover} />
              <span className={s.pvBarMeta}>
                <span className={s.pvBarTitle}>Стеклянный дом</span>
                <span className={s.pvBarArtist}>Мира</span>
              </span>
              <span className={s.pvTrack}>
                <span className={s.pvFill} />
              </span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
