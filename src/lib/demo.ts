/* Демо-каталог мокапа: вымышленные артисты и оригинальные строки —
   как в дизайн-системе, никаких настоящих текстов песен. */

export type DemoLine = {
  /** момент строки, доля трека 0..1 */
  t: number;
  text: string;
};

export type DemoTrack = {
  id: string;
  title: string;
  artist: string;
  cover: string;
  /** фиктивная длительность для подписи времени, сек */
  durationSec: number;
  lines: DemoLine[];
};

export const DEMO_TRACKS: DemoTrack[] = [
  {
    id: "glass-house",
    title: "Стеклянный дом",
    artist: "Никта",
    cover: "/covers/cover-1.png",
    durationSec: 204,
    lines: [
      { t: 0.02, text: "Город гаснет, этажи молчат" },
      { t: 0.16, text: "Я включаю свет из ничего" },
      { t: 0.3, text: "В стеклянном доме слышно каждый шаг" },
      { t: 0.44, text: "И ни одного слова моего" },
      { t: 0.58, text: "Пусть говорят, что тише — безопасней" },
      { t: 0.72, text: "Я оставляю звук на полную" },
      { t: 0.86, text: "В стеклянном доме мне не страшно" },
    ],
  },
  {
    id: "northern",
    title: "Северное сияние",
    artist: "Пасмурно",
    cover: "/covers/cover-3.png",
    durationSec: 187,
    lines: [
      { t: 0.02, text: "Ночь длиннее, чем мои сомнения" },
      { t: 0.16, text: "Снег идёт наверх, а не вниз" },
      { t: 0.3, text: "Я ловлю чужое настроение" },
      { t: 0.44, text: "Как антенны ловят чей-то смысл" },
      { t: 0.58, text: "Небо разгорается медленно" },
      { t: 0.72, text: "Полосами — зелёным по тьме" },
      { t: 0.86, text: "Это просто физика, наверное" },
    ],
  },
  {
    id: "five-to",
    title: "Без пяти минут",
    artist: "Мелом по асфальту",
    cover: "/covers/cover-6.png",
    durationSec: 221,
    lines: [
      { t: 0.02, text: "Без пяти минут рассвет" },
      { t: 0.16, text: "Двор рисует тени мелом" },
      { t: 0.3, text: "У подъезда спит сосед" },
      { t: 0.44, text: "Мир ещё не то, что делал" },
      { t: 0.58, text: "Я домой не тороплюсь" },
      { t: 0.72, text: "Плеер держит этот город" },
      { t: 0.86, text: "На повторе — ну и пусть" },
    ],
  },
];

/** Четвёртый ряд трек-листа — статичный, для плотности сцены */
export const EXTRA_ROW = {
  title: "Тише едешь",
  artist: "Вельвет",
  cover: "/covers/cover-4.png",
  durationSec: 176,
};

export function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
