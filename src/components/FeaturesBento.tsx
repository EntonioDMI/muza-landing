import type { CSSProperties } from "react";
import Reveal from "./Reveal";
import s from "./FeaturesBento.module.css";

/* Пять плашек с разными внутренними мини-сценами —
   у каждой своя микроанимация на hover. */

/* [высота покоя %, высота на hover %] — hover едет через scaleY, не height */
const EQ_BARS: ReadonlyArray<readonly [number, number]> = [
  [42, 70],
  [68, 45],
  [55, 85],
  [80, 58],
  [62, 92],
  [88, 50],
  [50, 78],
  [72, 62],
  [58, 88],
  [76, 54],
];

export default function FeaturesBento() {
  return (
    <section className={`container ${s.section}`} id="features">
      <Reveal>
        <h2 className={s.title}>Не только тексты</h2>
      </Reveal>
      <div className={s.grid}>
        {/* Звук */}
        <Reveal className={s.spanWide}>
          <article className={s.card}>
            <div className={s.eqScene} aria-hidden="true">
              {EQ_BARS.map(([rest, hover], i) => (
                <i
                  key={i}
                  style={
                    {
                      height: `${rest}%`,
                      "--eq-scale": (hover / rest).toFixed(3),
                    } as CSSProperties
                  }
                />
              ))}
            </div>
            <h3 className={s.cardTitle}>Звук под тебя</h3>
            <p className={s.cardText}>
              10-полосный эквалайзер с пресетами, кроссфейд между треками и
              выравнивание громкости — альбом звучит ровно, плейлист не скачет.
            </p>
          </article>
        </Reveal>

        {/* Discord RPC */}
        <Reveal delay={60} className={s.spanWide}>
          <article className={s.card}>
            <div className={s.rpcScene} aria-hidden="true">
              <span className={s.rpcDot} />
              <span className={s.rpcCoverWrap}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/covers/cover-1.png" alt="" className={s.rpcCover} />
              </span>
              <span className={s.rpcMeta}>
                <span className={s.rpcLine1}>Играет в Muza</span>
                <span className={s.rpcLine2}>Стеклянный дом — Мира</span>
              </span>
            </div>
            <h3 className={s.cardTitle}>Discord видит, что играет</h3>
            <p className={s.cardText}>
              Активность с обложкой, названием и своей кнопкой. Выключается
              одним тумблером, если сегодня не хочется делиться.
            </p>
          </article>
        </Reveal>

        {/* Умный шаффл */}
        <Reveal className={s.spanNarrow}>
          <article className={s.card}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/art/shuffle.webp" alt="" className={s.artScene} loading="lazy" />
            <h3 className={s.cardTitle}>Умный шаффл</h3>
            <p className={s.cardText}>
              Не крутит одно и то же: недавние треки отдыхают, очередь держит
              настроение.
            </p>
          </article>
        </Reveal>

        {/* Хоткеи */}
        <Reveal delay={60} className={s.spanNarrow}>
          <article className={s.card}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/art/hotkeys.webp" alt="" className={s.artScene} loading="lazy" />
            <h3 className={s.cardTitle}>Всё с клавиатуры</h3>
            <p className={s.cardText}>
              Пауза, поиск, лайк, громкость — глобальные хоткеи работают, даже
              когда окно свёрнуто.
            </p>
          </article>
        </Reveal>

        {/* Сон-таймер */}
        <Reveal delay={120} className={s.spanNarrow}>
          <article className={s.card}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/art/sleep-moon.webp" alt="" className={s.artScene} loading="lazy" />
            <h3 className={s.cardTitle}>Сон-таймер</h3>
            <p className={s.cardText}>
              15, 30, 60 минут или до конца трека — музыка выключится сама, а
              ты уже нет.
            </p>
          </article>
        </Reveal>
      </div>
    </section>
  );
}
