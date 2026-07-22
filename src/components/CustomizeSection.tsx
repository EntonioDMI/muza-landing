"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Check, Pipette, Play, RotateCcw } from "lucide-react";
import Reveal from "./Reveal";
import s from "./CustomizeSection.module.css";

/* Живая кастомизация: свотчи/пипетка/пресеты меняют переменные на <html> —
   перекрашивается весь лендинг. Главное в секции — превью-сцена прямо здесь
   (реструктуризация 2026-07-21: раньше главным была колонка формы, а эффект
   надо было помнить по мокапу в шести экранах выше). Каждый контрол обязан
   быть виден в превью: акцент — Play и прогресс, скругления — плитка/бар,
   шрифт — подписи, плотность стекла — панель бара ПОВЕРХ пёстрой обложки.
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

/** Шрифт интерфейса: демо той самой настройки приложения — переключает
 *  --font-ui всего лендинга вместе с превью. */
const FONTS = [
  { id: "golos", label: "Golos", family: `var(--font-golos, "Golos Text"), "Segoe UI", system-ui, sans-serif` },
  { id: "unbounded", label: "Unbounded", family: `var(--font-unbounded, "Unbounded"), "Segoe UI", system-ui, sans-serif` },
  { id: "system", label: "Системный", family: `"Segoe UI", system-ui, sans-serif` },
] as const;

/** Реальная широта кастомизации приложения (~76 ключей тем) — текстовой
 *  строкой, а не пилюлями: пилюли выглядели кликабельными и были мертвы
 *  (критика 2026-07-21, персона Jordan кликала «Свой CSS»). */
const APP_MORE =
  "фон — цвет, градиент, картинка или живой · стекло по зонам · скругления по типам " +
  "· свои цвета Play и слайдеров · свой шрифт файлом · размеры зон · скорость анимаций " +
  "· визуализатор · свой CSS · темы из маркетплейса";

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

const DEFAULTS = { accent: "sky", radius: "soft", glass: 62, font: "golos" } as const;

export default function CustomizeSection() {
  const [accent, setAccent] = useState<string>(DEFAULTS.accent);
  const [custom, setCustom] = useState<string | null>(null);
  const [radius, setRadius] = useState<string>(DEFAULTS.radius);
  const [glass, setGlass] = useState<number>(DEFAULTS.glass);
  const [font, setFont] = useState<string>(DEFAULTS.font);
  const colorRef = useRef<HTMLInputElement>(null);
  const accentRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const radiusRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const dirty =
    custom !== null ||
    accent !== DEFAULTS.accent ||
    radius !== DEFAULTS.radius ||
    glass !== DEFAULTS.glass ||
    font !== DEFAULTS.font;

  const reset = () => {
    setCustom(null);
    setAccent(DEFAULTS.accent);
    setRadius(DEFAULTS.radius);
    setGlass(DEFAULTS.glass);
    setFont(DEFAULTS.font);
  };

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

  useEffect(() => {
    const el = document.documentElement;
    if (font === "golos") el.style.removeProperty("--font-ui");
    else el.style.setProperty("--font-ui", FONTS.find((f) => f.id === font)?.family ?? "");
  }, [font]);

  return (
    <section className={`container ${s.section}`} id="customize">
      <Reveal>
        <div className={s.head}>
          <h2 className={s.title}>Твоя Muza</h2>
          <p className={s.text}>
            Акцент — хоть фирменный, хоть свой цвет пипеткой. Скругления, шрифт,
            плотность стекла — попробуй прямо здесь: сайт перекрасится целиком,
            вместе с превью.
          </p>
        </div>
      </Reveal>

      {/* Превью — главное: сцена «как в приложении», где виден КАЖДЫЙ контрол.
          Стеклянный плеер-бар лежит поверх пёстрой обложки — плотность стекла
          наконец видна глазами (раньше слайдер не менял ни пикселя). */}
      <Reveal delay={80}>
        <div className={s.preview} aria-hidden="true">
          <div className={s.pvScene}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/covers/cover-3.png" alt="" className={s.pvBackdrop} />
            <div className={s.pvTile}>
              {/* иконка плейлиста из фирменного набора pi-NN — как в приложении */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/playlist-icons/pi-03.png" alt="" className={s.pvCover} />
              <span className={s.pvName}>Ночной вайб</span>
              <span className={s.pvSub}>42 трека</span>
            </div>
            <div className={s.pvGlass}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/covers/cover-3.png" alt="" className={s.pvBarCover} />
              <span className={s.pvBarMeta}>
                <span className={s.pvBarTitle}>Стеклянный дом</span>
                <span className={s.pvBarArtist}>Мира</span>
              </span>
              <span className={s.pvTrack}>
                <span className={s.pvFill} />
              </span>
              <span className={s.pvPlay}>
                <Play strokeWidth={1.75} fill="currentColor" />
              </span>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Контролы — вторым планом, одной панелью под превью */}
      <Reveal delay={140}>
        <div className={s.controls}>
          <div className={s.group}>
            <div className={s.groupLabel} id="customize-accent-label">
              Акцент
            </div>
            <div className={s.swatches} role="radiogroup" aria-labelledby="customize-accent-label">
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
                  {!custom && accent === a.id && <Check strokeWidth={2.5} className={s.swatchCheck} />}
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
          </div>

          <div className={s.group}>
            <div className={s.groupLabel} id="customize-radius-label">
              Скругления
            </div>
            <div className={s.chips} role="radiogroup" aria-labelledby="customize-radius-label">
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
          </div>

          <div className={s.group}>
            <div className={s.groupLabel} id="customize-font-label">
              Шрифт
            </div>
            <div className={s.chips} role="radiogroup" aria-labelledby="customize-font-label">
              {FONTS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  role="radio"
                  aria-checked={font === f.id}
                  className={`${s.chip} ${font === f.id ? s.chipOn : ""}`}
                  style={{ fontFamily: f.family }}
                  onClick={() => setFont(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className={`${s.group} ${s.groupGrow}`}>
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
          </div>

          <button type="button" className={s.reset} onClick={reset} disabled={!dirty}>
            <RotateCcw strokeWidth={1.75} className={s.resetIcon} aria-hidden="true" />
            Сбросить
          </button>
        </div>
      </Reveal>

      <Reveal delay={180}>
        <p className={s.more}>А в приложении ещё: {APP_MORE}.</p>
      </Reveal>
    </section>
  );
}
