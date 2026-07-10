/* Демо-каталог мокапа — 1-в-1 из демо-каталога приложения
   (muza-client/apps/desktop/src/data/demo.ts): те же вымышленные артисты,
   те же оригинальные строки. Тайминги строк сжаты под 14-секундный цикл. */

export type DemoLine = {
  /** момент строки, доля трека 0..1 */
  t: number;
  text: string;
};

export type DemoTrack = {
  id: string;
  title: string;
  artist: string;
  album: string;
  cover: string;
  /** фиктивная длительность для подписи времени, сек */
  durationSec: number;
  lines: DemoLine[];
};

export type DemoCollection = {
  id: string;
  name: string;
  meta: string;
  cover: string;
};

/** Ровно распределяет строки по циклу трека */
function spread(lines: string[]): DemoLine[] {
  const n = lines.length;
  return lines.map((text, i) => ({ t: 0.02 + (i * 0.86) / (n - 1), text }));
}

export const DEMO_TRACKS: DemoTrack[] = [
  {
    id: "komety",
    title: "Кометы над городом",
    artist: "Северный ветер",
    album: "Полночь",
    cover: "/covers/cover-1.png",
    durationSec: 212,
    lines: spread([
      "Город засыпает, я включаю свет",
      "На кухне остывает старый чёрный плед",
      "Ты мне пишешь: «выйди, посмотри наверх»",
      "Кометы над городом — на всех",
      "Мы стоим на крыше, ловим этот свет",
      "Никакой цензуры, никаких помех",
      "Пусть соседи злятся — нам плевать на всех",
      "Кометы над городом — на всех",
    ]),
  },
  {
    id: "motor",
    title: "Не глуши мотор",
    artist: "Пламя",
    album: "Сингл",
    cover: "/covers/cover-2.png",
    durationSec: 187,
    lines: spread([
      "Три часа ночи, город пуст, как чёрт",
      "Ты сказала: «едем», я сказал: «а то»",
      "Фонари мигают в такт на сто шестьдесят",
      "Не глуши мотор, не тормози назад",
      "Весь этот текст — как есть, без звёзд и точек",
      "Муза не боится неудобных строчек",
      "Кто-то заблюрит — мы споём дословно",
      "Громко, неровно, зато свободно",
    ]),
  },
  {
    id: "glass",
    title: "Стеклянный дом",
    artist: "Мира",
    album: "Тише",
    cover: "/covers/cover-3.png",
    durationSec: 234,
    lines: spread([
      "В стеклянном доме не бросают слов",
      "Здесь каждый шёпот слышен сквозь стекло",
      "Я растворяюсь в матовом окне",
      "И город медленно плывёт ко мне",
      "Тише, тише — не буди рассвет",
      "Пусть эта ночь оставит мягкий след",
      "Стеклянный дом, а в нём — одни огни",
      "Останься до восьми",
    ]),
  },
];

/** Четвёртая плитка полки — срезается краем, как в приложении (полка скроллится) */
export const EXTRA_TILE = {
  title: "Один процент",
  artist: "ОКТАВА",
  cover: "/covers/cover-4.png",
};

/** Плейлисты сайдбара и полки «Собрано для тебя» — как в приложении */
export const PLAYLISTS: DemoCollection[] = [
  { id: "p1", name: "Ночной вайб", meta: "42 трека", cover: "/covers/cover-5.png" },
  { id: "p2", name: "Для дороги", meta: "28 треков", cover: "/covers/cover-6.png" },
  { id: "p3", name: "Любимое", meta: "117 треков", cover: "/covers/cover-7.png" },
];

export function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
