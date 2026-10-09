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

### Teaching tools

While a call is running, a toolbar appears at the bottom-left:

| Tool | What it does |
|---|---|
| 🎓 **Take the lead** | Everyone follows your subject, section, lesson and scrolling |
| 🔦 **Laser** | Your pointer shows as a glowing dot on their screen |
| ✏️ **Pen** | Draw over the lesson in five colours — strokes appear on their screen |
| 🎯 **Spotlight** | Click anything to flash it on every screen |
| 🧹 **Clear** | Wipe the drawing everywhere |
| 💡 **Show answer** | Reveal a question's answer to everyone at once |

Whoever is being led sees a *"Following Ahmed"* banner with a **Stop** button, and
scrolling yourself pauses follow-scroll for 3 seconds so you are never fought for
control. Picking any tool turns on leading automatically.

**Show answer** works even on a question nobody has attempted yet — it marks the
correct option and says "💡 The answer is …" without recording anything against
the student's score, and she can still answer it herself afterwards.

All of this travels over Jitsi's own participant data channel
(`sendEndpointTextMessage`), so there is still no server of ours involved.
Drawing and pointer coordinates are normalised against the lesson panel's **width**
for both axes, so a shape keeps its proportions on a different screen size.
Incoming messages are treated as untrusted: malformed payloads are ignored, and
a reveal key is matched against real elements rather than injected into a selector.

## Structure

```
index.html        page shell only — markup, meta, font + asset links
src/data.js       all lesson content (englishSections, mathSections)
src/app.js        state, persistence, views, keyboard
src/figures.js    SVG diagrams for the Geometry + Trigonometry lessons
src/call.js       the "study together" video call panel (Jitsi embed)
src/teach.js      presenter mode + laser / pen / spotlight / show-answer
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

## Lesson diagrams

All 12 **Geometry** and **Trigonometry** lessons carry a drawing, shown between
the example and the practice questions — Pythagoras with the three squares on
its sides, a hexagon split into triangles, the colour-coded SOH CAH TOA
triangle, a compass bearing, a coordinate reflection, and so on. Each one uses
the numbers from that lesson's own example, so the picture and the text agree.

They are inline SVG built in `src/figures.js`, drawn with shared geometry
helpers (`angleArc`, `rightAngle`, `sideLabel`) rather than hand-placed
coordinates, and coloured entirely through CSS theme tokens — so one drawing
serves light mode, dark mode and both subject accents, and scales from desktop
down to a phone without a second asset.

A figure is matched by **section name plus lesson number**, never the number
alone: English numbers its lessons 17–28 as well, and would otherwise inherit
geometry diagrams.

To give another lesson a diagram, add a builder to `MAP` in `src/figures.js`
and include its section in `DRAWN_SECTIONS`.

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
