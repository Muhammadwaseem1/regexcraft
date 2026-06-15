# regexcraft ⚡

> regex tester for humans

Testing regex shouldn't require a PhD or a trip to regex101. regexcraft is a clean, fast, client-side tool that shows you exactly what's matching and why — with zero distractions.

## What it does

— **Real-time match highlighting** — matches light up in amber as you type your pattern, no submit button needed  
— **Match breakdown panel** — every match listed with its position, capture groups ($1, $2...), and named groups  
— **Replace mode** — test replacements with full backreference support ($&, $1, $`, $')  
— **Flag toggles** — flip `i`, `m`, `s` flags with one click; `g` always on for sanity  
— **Preset library** — one-click patterns for Email, URL, IPv4, Hex Color, SemVer, JWT, Phone, Date  
— **Quick reference** — collapsible cheat sheet so you don't have to memorize everything  

## Getting started

```bash
git clone https://github.com/Muhammadwaseem1/regexcraft
cd regexcraft
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and start crafting.

## Built with

- [Next.js 15](https://nextjs.org/) — App Router, static export
- [React 19](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- Zero runtime dependencies for the tool logic — pure browser RegExp API

## Why I built this

I kept context-switching to browser tabs mid-coding just to test a regex. I wanted something that lives in my stack, loads instantly, and doesn't shove ads or paywalls in my face. Spent a Saturday evening on it. It's not trying to be everything — just the thing I'd actually reach for.

---

MIT License
