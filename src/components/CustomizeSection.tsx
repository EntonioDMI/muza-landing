"use client";

import { useEffect, useState } from "react";
import { Check, Play } from "lucide-react";
import Reveal from "./Reveal";
import s from "./CustomizeSection.module.css";

/* Живая кастомизация: свотчи и пресеты меняют data-accent / data-radius
   на <html> — перекрашивается весь лендинг, включая мокап в герое. */

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

export default function CustomizeSection() {
  const [accent, setAccent] = useState<string>("sky");
  const [radius, setRadius] = useState<string>("soft");

  useEffect(() => {
    const el = document.documentElement;
    if (accent === "sky") delete el.dataset.accent;
    else el.dataset.accent = accent;
    if (radius === "soft") delete el.dataset.radius;
    else el.dataset.radius = radius;
  }, [accent, radius]);

  return (
    <section className={`container ${s.section}`}>
      <div className={s.cols}>
        <Reveal className={s.colText}>
          <div>
            <h2 className={s.title}>Твоя Muza</h2>
            <p className={s.text}>
              Один акцент на всё приложение, скругления на твой вкус и плотность
              стекла — Muza выглядит так, как хочешь ты. Попробуй прямо здесь:
              сайт перекрасится вместе с мокапом.
            </p>

            <div className={s.groupLabel}>Акцент</div>
            <div className={s.swatches} role="radiogroup" aria-label="Акцентный цвет">
              {ACCENTS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  role="radio"
                  aria-checked={accent === a.id}
                  aria-label={a.label}
                  className={s.swatch}
                  style={{ background: a.color }}
                  onClick={() => setAccent(a.id)}
                >
                  {accent === a.id && <Check strokeWidth={2.5} className={s.swatchCheck} />}
                </button>
              ))}
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
              <span className={s.pvName}>Энергия</span>
              <span className={s.pvSub}>подборка</span>
            </div>
            <div className={s.pvBar}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/covers/cover-3.png" alt="" className={s.pvBarCover} />
              <span className={s.pvBarMeta}>
                <span className={s.pvBarTitle}>Северное сияние</span>
                <span className={s.pvBarArtist}>Пасмурно</span>
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
