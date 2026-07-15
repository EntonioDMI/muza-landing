"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Check, Pipette, Play } from "lucide-react";
import Reveal from "./Reveal";
import s from "./CustomizeSection.module.css";

/* Живая кастомизация: свотчи/пипетка/пресеты меняют переменные на <html> —
   перекрашивается весь лендинг, включая мокап в герое.
   Деривация оттенков своего цвета — как lib/accent.ts в приложении. */

const ACCENTS = [
  { id: "sky", color: "#3b82f6", label: "Небо" },
  { id: "red", color: "#f76967", label: "Пламя" },
  { id: "ocean", color: "#327ad9", label: "Океан" },
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

function relLuminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
}

/** Контраст-гард: белый текст на светлом акценте нечитаем (< 3:1) — берём тёмный */
function onAccentColor(hex: string): string {
  const contrastWithWhite = 1.05 / (relLuminance(hex) + 0.05);
  return contrastWithWhite >= 3 ? "#ffffff" : "#121110";
}

const BG_LUMINANCE = relLuminance("#121110");

/** Гард «акцент ≈ фон»: почти чёрный свой цвет растворил бы акцентную кнопку
    в странице — приподнимаем его к белому до различимого */
function visibleAccent(hex: string): string {
  const l = relLuminance(hex);
  const ratio = (Math.max(l, BG_LUMINANCE) + 0.05) / (Math.min(l, BG_LUMINANCE) + 0.05);
  if (ratio >= 1.4) return hex;
  const n = parseInt(hex.slice(1), 16);
  const up = (c: number) =>
    Math.round(c + (255 - c) * 0.22)
      .toString(16)
      .padStart(2, "0");
  return `#${up((n >> 16) & 255)}${up((n >> 8) & 255)}${up(n & 255)}`;
}

/** Клавиатура radiogroup: стрелки ходят по опциям, Home/End — в края */
function nextRadioIndex(key: string, current: number, count: number): number {
  switch (key) {
    case "ArrowRight":
    case "ArrowDown":
      return (current + 1) % count;
    case "ArrowLeft":
    case "ArrowUp":
      return (current - 1 + count) % count;
    case "Home":
      return 0;
    case "End":
      return count - 1;
    default:
      return -1;
  }
}

export default function CustomizeSection() {
  const [accent, setAccent] = useState<string>("sky");
  const [custom, setCustom] = useState<string | null>(null);
  const [radius, setRadius] = useState<string>("soft");
  const [glass, setGlass] = useState(62);
  const colorRef = useRef<HTMLInputElement>(null);
  const accentRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const radiusRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const el = document.documentElement;
    if (custom) {
      const applied = visibleAccent(custom);
      delete el.dataset.accent;
      el.style.setProperty("--accent", applied);
      el.style.setProperty("--accent-hover", mixWhite(applied, 0.18));
      el.style.setProperty("--accent-text", mixWhite(applied, 0.42));
      el.style.setProperty("--accent-soft", softOf(applied));
      el.style.setProperty("--text-on-accent", onAccentColor(applied));
    } else {
      const props = ["--accent", "--accent-hover", "--accent-text", "--accent-soft", "--text-on-accent"];
      for (const p of props) el.style.removeProperty(p);
      if (accent === "sky") delete el.dataset.accent;
      else el.dataset.accent = accent;
    }
    if (radius === "soft") delete el.dataset.radius;
    else el.dataset.radius = radius;
  }, [accent, custom, radius]);

  /** Индекс выбранного в группе акцентов: 0..2 — пресеты, 3 — свой цвет */
  const accentIndex = custom ? ACCENTS.length : ACCENTS.findIndex((a) => a.id === accent);

  const onAccentKeyDown = (idx: number) => (e: KeyboardEvent<HTMLButtonElement>) => {
    const next = nextRadioIndex(e.key, idx, ACCENTS.length + 1);
    if (next === -1) return;
    e.preventDefault();
    accentRefs.current[next]?.focus();
    // пресеты выбираются сразу; «свой цвет» только фокусируется — пипетку открывает Enter/пробел
    if (next < ACCENTS.length) {
      setCustom(null);
      setAccent(ACCENTS[next].id);
    }
  };

  const radiusIndex = RADII.findIndex((r) => r.id === radius);

  const onRadiusKeyDown = (idx: number) => (e: KeyboardEvent<HTMLButtonElement>) => {
    const next = nextRadioIndex(e.key, idx, RADII.length);
    if (next === -1) return;
    e.preventDefault();
    radiusRefs.current[next]?.focus();
    setRadius(RADII[next].id);
  };

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
        <Reveal>
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
              {ACCENTS.map((a, i) => (
                <button
                  key={a.id}
                  ref={(el) => {
                    accentRefs.current[i] = el;
                  }}
                  type="button"
                  role="radio"
                  aria-checked={!custom && accent === a.id}
                  aria-label={a.label}
                  tabIndex={accentIndex === i ? 0 : -1}
                  className={s.swatch}
                  style={{ background: a.color }}
                  onKeyDown={onAccentKeyDown(i)}
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
                ref={(el) => {
                  accentRefs.current[ACCENTS.length] = el;
                }}
                type="button"
                role="radio"
                aria-checked={!!custom}
                className={`${s.swatch} ${s.swatchCustom}`}
                style={custom ? { background: custom } : undefined}
                aria-label="Свой цвет"
                tabIndex={accentIndex === ACCENTS.length ? 0 : -1}
                onKeyDown={onAccentKeyDown(ACCENTS.length)}
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
              {RADII.map((r, i) => (
                <button
                  key={r.id}
                  ref={(el) => {
                    radiusRefs.current[i] = el;
                  }}
                  type="button"
                  role="radio"
                  aria-checked={radius === r.id}
                  tabIndex={radiusIndex === i ? 0 : -1}
                  className={`${s.chip} ${radius === r.id ? s.chipOn : ""}`}
                  onKeyDown={onRadiusKeyDown(i)}
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
              aria-valuetext={`${glass}%`}
            />

            <div className={s.groupLabel}>А в приложении ещё</div>
            <p className={s.moreText}>Фон, свой CSS и темы из маркетплейса.</p>
          </div>
        </Reveal>

        <Reveal delay={80}>
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
