# Mariam's EST1 Lessons

Static single-page study site for EST1 prep (English + Math), built as
**Rule → Example → Practice** with instant-feedback multiple-choice questions
and per-lesson score breakdown.

## Structure

```
index.html     the whole app (HTML + CSS + JS, no build step)
vercel.json    static hosting config: clean URLs, security headers, cache policy
```

No dependencies, no build, no server code. Vercel serves `index.html` directly.

## Run locally

```bash
npx serve .
```

Or just open `index.html` in a browser.

## Deploy to Vercel

First time (from this folder):

```bash
npx vercel
```

Accept the defaults — when asked about framework, choose **Other**; leave
build command and output directory empty.

Then to publish to production:

```bash
npx vercel --prod
```

### Or deploy from Git

Push this folder to a GitHub/GitLab/Bitbucket repo, then in the Vercel
dashboard: **Add New → Project → Import** the repo. Framework Preset
**Other**, no build command, output directory `.` (root). Every push to the
default branch then redeploys production automatically.

## Editing content

All lessons live in two arrays near the top of the `<script>` block in
`index.html`:

- `englishSections` — grouped by section name (Grammar, etc.)
- `mathSections`

Each lesson is:

```js
{ title: "...", rule: "...", example: "...",
  mcqs: [ { q: "...", options: ["a","b","c","d"], correct: 0 } ] }
```

`correct` is the zero-based index into `options`. Add a lesson or a question by
adding an object to the array — the tabs, progress bar, scoring and breakdown
all derive from these arrays, so nothing else needs changing.
