# Mariam's EST1 Lessons

A study site for EST1 prep (English + Math), taught as **Rule → Example → Practice**.
64 lessons, 256 practice questions, across 11 sections.

Live: https://est-mariam.vercel.app

## How it works for the student

- **Progress saves itself.** Answers, position and settings live in `localStorage`,
  so closing the tab and coming back later resumes where she left off.
- **Learn mode** (default) — the rule and example are shown, and each answer is
  marked right or wrong the moment it is picked, with the correct answer named.
- **Test mode** — the rule and example start hidden behind a reveal button, and
  nothing is marked until *Check answers*, so a lesson can be used as a mini exam.
- **One lesson at a time**, with a step bar showing which lessons in the section
  are untouched, started, or fully correct.
- **Review list** — every question answered wrongly collects into *Practice again*.
  Answering it correctly clears it. Opening the list never erases her record.
- **Progress rings** per section, plus an overall bar for the current subject.
- **Keyboard**: `1`–`4` answer the current question, `←` `→` move between lessons,
  `Esc` returns to the section list.
- **Light and dark**, following the system setting until the moon/sun button is used.
- Honours `prefers-reduced-motion`, and every control is keyboard reachable with a
  visible focus ring.

## Structure

```
index.html        page shell only — markup, meta, font + asset links
src/data.js       all lesson content (englishSections, mathSections)
src/app.js        state, persistence, views, keyboard
src/styles.css    design tokens, light/dark themes, layout, animation
avatar.webp       header portrait, favicon and social preview image
vercel.json       static hosting: clean URLs, security headers, cache policy
```

No build step and no dependencies — Vercel serves these files as they are.

## Run locally

```bash
python -m http.server 4173
```

Then open http://localhost:4173. (Open `index.html` directly and the browser will
block `src/*` as cross-origin, so use a server.)

## Deploy

```bash
vercel --prod
```

Pushing to `main` on GitHub also deploys automatically, because the repo is
connected to a Vercel project.

## Editing the lessons

Everything a lesson needs is in `src/data.js`. A section looks like:

```js
{
  name: "Grammar",
  lessons: [
    { title: "1) Subject–Verb Agreement",
      rule:    "...",
      example: "...",
      mcqs: [
        { q: "Neither of the boys ___ here.",
          options: ["is","are","were","have"],
          correct: 0 }
      ] }
  ]
}
```

`correct` is the zero-based index into `options`. Add a question by adding an
object to `mcqs`; add a lesson or a whole section the same way. Section cards,
step bars, progress rings, scoring and the review list all derive from this file,
so nothing else needs touching.

Lesson text is inserted with `textContent`, so characters like `<`, `>` and `&`
are safe to type literally — no HTML escaping needed.
