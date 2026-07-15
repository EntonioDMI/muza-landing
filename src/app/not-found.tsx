import type { Metadata } from "next";
import s from "./not-found.module.css";

export const metadata: Metadata = {
  title: "Muza — такой страницы нет",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <main className={`container ${s.page}`}>
      <p className={s.code} aria-hidden="true">
        404
      </p>
      <h1 className={s.title}>Такой страницы нет</h1>
      <p className={s.text}>Ссылка устарела или в адресе опечатка.</p>
      <a href="/" className={`btn btn-surface ${s.home}`}>
        На главную
      </a>
    </main>
  );
}
