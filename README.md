# muza-landing

Лендинг [muza.lol](https://muza.lol) — сайт десктоп-плеера [Muza](https://github.com/EntonioDMI/muza-client).

Концепция «Живой плеер»: герой — не скриншот, а живой DOM-мокап окна приложения (синхротекст листается, треки сменяются, EQ дышит). Секция текстов ведёт себя как караоке-режим, а блок кастомизации перекрашивает весь сайт вживую.

## Стек

- Next.js (App Router) со статическим экспортом (`output: 'export'`) — на выходе чистая статика в `out/`
- Сборка через webpack (`--webpack`): Turbopack падает на кириллических путях
- Дизайн-токены Muza Design System (тёплый почти-чёрный, один акцент, слои вместо рамок, без градиентов и теней)
- Шрифты self-hosted: `@fontsource/golos-text` + `@fontsource/unbounded`
- Иконки lucide-react

## Команды

```bash
pnpm install
pnpm dev        # localhost:3000
pnpm build      # статика в out/
pnpm typecheck
```

## Деплой

`out/` выкладывается в `/var/www/muza-landing` на сервере, отдаётся Caddy (блок `muza.lol` в Caddyfile). TLS Caddy выпускает сам.
