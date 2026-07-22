"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Menu, X } from "lucide-react";
import { REPOSITORY_RELEASES_URL, WEB_APP_URL, type LandingRelease } from "@/lib/release";
import s from "./Header.module.css";

const NAV = [
  { href: "#lyrics", label: "Тексты" },
  { href: "#features", label: "Возможности" },
  { href: "#customize", label: "Кастомизация" },
  { href: WEB_APP_URL, label: "Веб-версия" },
  { href: "https://github.com/EntonioDMI/muza-client", label: "GitHub", external: true },
] as const;

export default function Header({ release }: { release: LandingRelease }) {
  // Наверху страницы пилюля прозрачна (стеклу нечего размывать над героем),
  // на скролле — стекло: материал появляется ровно тогда, когда под ним
  // начинает проезжать контент, и потому виден как матовый.
  const [scrolled, setScrolled] = useState(false);
  // Мобильное меню: до 2026-07-21 навигации <720px не было ВООБЩЕ — до секций
  // страницы в ~9000px можно было добраться только скроллом (критика, Casey).
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    const onPointer = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, [menuOpen]);

  const linkProps = (item: (typeof NAV)[number]) =>
    "external" in item && item.external
      ? { target: "_blank", rel: "noopener noreferrer" as const }
      : {};

  return (
    // шторка — СИБЛИНГ пилюли, не потомок: у .inner свой backdrop-filter, и
    // потомок-стекло сэмплировал бы пустоту (backdrop-root), а не страницу
    <header className={s.header} ref={menuRef}>
      <div className={s.inner} data-scrolled={scrolled || menuOpen || undefined}>
        <a href="#top" className={s.brand} aria-label="Muza — наверх">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo/glyph.svg" alt="" className={s.glyph} />
          <span className={s.wordmark}>Muza</span>
        </a>
        <nav className={s.nav} aria-label="Разделы">
          {NAV.map((item) => (
            <a key={item.href} href={item.href} {...linkProps(item)}>
              {item.label}
            </a>
          ))}
        </nav>
        {release.kind === "available" ? (
          <a className={`btn btn-accent ${s.cta}`} href={release.downloadUrl}>
            <Download strokeWidth={1.75} className={s.ctaIcon} aria-hidden="true" />
            {`Скачать Muza ${release.tag}`}
          </a>
        ) : (
          <a
            className={`btn btn-surface ${s.cta}`}
            href={REPOSITORY_RELEASES_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Следить на GitHub
          </a>
        )}
        <button
          type="button"
          className={s.menuBtn}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? (
            <X strokeWidth={1.75} aria-hidden="true" />
          ) : (
            <Menu strokeWidth={1.75} aria-hidden="true" />
          )}
        </button>
      </div>
      {menuOpen ? (
        <nav className={s.sheet} aria-label="Разделы">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              {...linkProps(item)}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </a>
          ))}
        </nav>
      ) : null}
    </header>
  );
}
