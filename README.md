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

## Study together (live call)

The camera button in the header starts a video/voice call in a floating panel, so
lessons stay fully usable while you talk — you can change lesson, answer questions
and switch sections without dropping the call. The panel resizes, minimises to a
bar, and on phones docks to the bottom of the screen.

Starting a call creates a private room and an invite link
(`…/?call=mariam-est1-xxxxxxxxxxxxxx`). Opening that link goes straight to a
join form.

It runs on the free public **Jitsi Meet** service via its embed API — no server,
no account and no API key on our side. Two things to know:

- **Whoever starts the room is asked by Jitsi to sign in once** with Google,
  GitHub or Facebook. This is Jitsi's rule for their public server, not ours.
  Whoever joins afterwards needs no account at all.
- The room name is the only thing guarding the call, so it is generated with
  `crypto.getRandomValues` (14 random characters) rather than something
  guessable. For extra safety the moderator can set a password from Jitsi's own
  security menu once inside.

To avoid the sign-in entirely you would need to self-host Jitsi, or move to a
service like Daily.co — which needs an account, an API key and therefore a small
server-side function to keep the key out of the browser.

## Structure

```
index.html        page shell only — markup, meta, font + asset links
src/data.js       all lesson content (englishSections, mathSections)
src/app.js        state, persistence, views, keyboard
src/call.js       the "study together" video call panel (Jitsi embed)
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
