/* ============================================================
   Mariam's EST1 Lessons — app logic
   Content lives in data.js (englishSections / mathSections).
   ============================================================ */

const SUBJECTS = { english: englishSections, math: mathSections };
const STORE_KEY = 'mariam-est1-v2';
const RING_C = 2 * Math.PI * 19;          /* circumference of the progress ring */

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- state ---------- */
const fresh = () => ({
  mode: 'learn',                           /* learn | test */
  theme: null,                             /* null = follow the system */
  subject: 'english',
  pos: { english: [0, 0], math: [0, 0] },  /* [sectionIndex, lessonIndex] */
  answers: {}                              /* "english:0:1:2" -> { p:pickedIndex, c:wasCorrect } */
});
let S = fresh();
let view = { name: 'home' };

/* localStorage can throw (private mode, blocked cookies) — never let that break the page */
function load(){
  try{
    const raw = localStorage.getItem(STORE_KEY);
    if(raw) S = Object.assign(fresh(), JSON.parse(raw));
  }catch(e){ /* carry on with defaults */ }
}
function save(){
  try{ localStorage.setItem(STORE_KEY, JSON.stringify(S)); }catch(e){}
}

/* ---------- small helpers ---------- */
const $  = (sel, root = document) => root.querySelector(sel);
const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if(cls)  n.className = cls;
  if(text != null) n.textContent = text;       /* textContent: lesson text is never parsed as HTML */
  return n;
};
const sections   = () => SUBJECTS[S.subject];
const key        = (si, li, qi) => `${S.subject}:${si}:${li}:${qi}`;
const subjectName= () => S.subject === 'english' ? 'English' : 'Math';

function sectionTotals(si){
  let total = 0, done = 0, correct = 0;
  sections()[si].lessons.forEach((lesson, li) => lesson.mcqs.forEach((_, qi) => {
    total++;
    const a = S.answers[key(si, li, qi)];
    if(a){ done++; if(a.c) correct++; }
  }));
  return { total, done, correct };
}
function subjectTotals(){
  let total = 0, done = 0, correct = 0;
  sections().forEach((_, si) => {
    const t = sectionTotals(si);
    total += t.total; done += t.done; correct += t.correct;
  });
  return { total, done, correct };
}
function mistakes(){
  const out = [];
  sections().forEach((sec, si) => sec.lessons.forEach((lesson, li) => lesson.mcqs.forEach((mcq, qi) => {
    const a = S.answers[key(si, li, qi)];
    if(a && !a.c) out.push({ si, li, qi, mcq, lesson });
  })));
  return out;
}

function toast(msg){
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('up');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('up'), 2600);
}

/* ============================================================
   CHROME: theme, mode, avatar, decor
   ============================================================ */
function applyTheme(){
  const dark = S.theme === null
    ? matchMedia('(prefers-color-scheme: dark)').matches
    : S.theme === 'dark';
  document.body.classList.toggle('dark', dark);
  $('#themeBtn').textContent = dark ? '☀️' : '\u{1F319}';
  $('#themeBtn').setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
}
function toggleTheme(){
  S.theme = document.body.classList.contains('dark') ? 'light' : 'dark';
  applyTheme(); save();
}
function setMode(m){
  S.mode = m; save();
  $('#modeLearn').classList.toggle('on', m === 'learn');
  $('#modeTest').classList.toggle('on', m === 'test');
  $('#modeLearn').setAttribute('aria-pressed', m === 'learn');
  $('#modeTest').setAttribute('aria-pressed', m === 'test');
  if(view.name === 'lesson') renderLesson(view.si, view.li);
  toast(m === 'learn'
    ? 'Learn mode — you get the answer straight away'
    : 'Test mode — rule hidden, answers checked at the end');
}
function spinAvatar(img){
  img.classList.remove('spin'); void img.offsetWidth; img.classList.add('spin');
}
function buildDecor(){
  if(reduceMotion) return;
  const box = $('#decor');
  const glyphs = ['\u{1F497}', '⭐', '\u{1F338}', '\u{1F49B}', '✨'];
  for(let i = 0; i < 14; i++){
    const s = el('span', null, glyphs[i % glyphs.length]);
    s.style.left = (Math.random() * 100) + '%';
    s.style.fontSize = (14 + Math.random() * 18).toFixed(0) + 'px';
    s.style.animationDuration = (18 + Math.random() * 16).toFixed(1) + 's';
    s.style.animationDelay = (-Math.random() * 32).toFixed(1) + 's';
    s.style.opacity = (0.3 + Math.random() * 0.3).toFixed(2);
    box.appendChild(s);
  }
}

/* ============================================================
   TOP STRIP: overall progress for the current subject
   ============================================================ */
function renderOverall(){
  const { total, correct } = subjectTotals();
  const pct = total ? (correct / total) * 100 : 0;
  $('#overallLabel').textContent = subjectName() + ' progress';
  $('#overallStat').innerHTML = '';
  $('#overallStat').append(
    Object.assign(document.createElement('b'), { textContent: correct }),
    document.createTextNode(` of ${total} questions correct`)
  );
  $('#overallFill').style.width = pct + '%';
}

/* ============================================================
   HOME
   ============================================================ */
function goHome(){
  view = { name: 'home' };
  const main = $('#main');
  main.innerHTML = '';

  const panel = el('div', 'panel');
  panel.append(el('div', 'panel-title', 'Choose what to study'));
  panel.append(el('div', 'panel-sub', 'Pick a subject, then a section. Your progress saves itself.'));

  /* subject switch */
  const subs = el('div', 'subjects');
  subs.setAttribute('role', 'tablist');
  [['english', 'English'], ['math', 'Math']].forEach(([id, label]) => {
    const b = el('button', 'subject-btn' + (S.subject === id ? ' on' : ''), label);
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-selected', S.subject === id);
    b.onclick = () => {
      S.subject = id;
      document.body.classList.toggle('math-theme', id === 'math');
      save(); renderOverall(); goHome();
    };
    subs.append(b);
  });
  panel.append(subs);

  /* resume + review shortcuts */
  const stack = el('div', 'cta-stack');
  const [psi, pli] = S.pos[S.subject];
  const started = subjectTotals().done > 0;
  if(started && sections()[psi]){
    const r = el('button', 'resume-card');
    r.append(el('span', 'resume-icon', '▶️'));
    const meta = el('span', 'resume-meta');
    meta.append(el('div', 'resume-label', 'Continue where you left off'));
    meta.append(el('div', 'resume-where',
      `${sections()[psi].name} — ${sections()[psi].lessons[pli].title}`));
    r.append(meta);
    r.onclick = () => renderLesson(psi, pli);
    stack.append(r);
  }
  const bad = mistakes();
  if(bad.length){
    const r = el('button', 'resume-card');
    r.style.borderColor = 'var(--bad-br)';
    r.style.background = 'var(--bad-bg)';
    r.append(el('span', 'resume-icon', '\u{1F504}'));
    const meta = el('span', 'resume-meta');
    meta.append(el('div', 'resume-label', 'Practice again'));
    meta.append(el('div', 'resume-where',
      `${bad.length} question${bad.length > 1 ? 's' : ''} to put right`));
    r.append(meta);
    r.onclick = renderReview;
    stack.append(r);
  }
  if(stack.children.length) panel.append(stack);

  /* section grid */
  const grid = el('div', 'sections');
  sections().forEach((sec, si) => {
    const { total, correct } = sectionTotals(si);
    const pct = total ? Math.round((correct / total) * 100) : 0;

    const card = el('button', 'sec-card' + (pct === 100 ? ' done' : ''));
    card.style.animationDelay = (si * 0.04).toFixed(2) + 's';

    const ringWrap = el('span', 'ring-wrap');
    ringWrap.innerHTML =
      `<svg class="ring" viewBox="0 0 46 46" aria-hidden="true">
         <circle class="track" cx="23" cy="23" r="19"></circle>
         <circle class="bar" cx="23" cy="23" r="19"
                 stroke-dasharray="${RING_C}" stroke-dashoffset="${RING_C * (1 - pct / 100)}"></circle>
       </svg>`;
    ringWrap.append(el('span', 'ring-pct', pct + '%'));

    const meta = el('span', 'sec-meta');
    meta.append(el('span', 'sec-name', sec.name));
    meta.append(el('span', 'sec-count',
      `${sec.lessons.length} lessons · ${correct}/${total} correct`));

    card.append(ringWrap, meta);
    card.setAttribute('aria-label', `${sec.name}, ${pct}% correct`);
    card.onclick = () => renderLesson(si, 0);
    grid.append(card);
  });
  panel.append(grid);

  /* reset */
  const row = el('div', 'btn-row');
  const reset = el('button', 'btn ghost', 'Start over');
  reset.onclick = () => {
    if(!confirm('Clear all saved progress for English and Math? This cannot be undone.')) return;
    S = Object.assign(fresh(), { mode: S.mode, theme: S.theme, subject: S.subject });
    save(); renderOverall(); goHome(); toast('Progress cleared');
  };
  row.append(reset);
  panel.append(row);

  main.append(panel);
  renderOverall();
  window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
}

/* ============================================================
   QUESTION COMPONENT
   ============================================================ */
function questionEl(si, li, qi, mcq, opts = {}){
  const k = key(si, li, qi);
  const wrap = el('div', 'q');
  wrap.dataset.key = k;

  const qt = el('div', 'q-text');
  qt.append(el('span', 'q-num', `Q${qi + 1}. `));
  qt.append(document.createTextNode(mcq.q));
  wrap.append(qt);

  const group = el('div', 'opts');
  group.setAttribute('role', 'group');
  group.setAttribute('aria-label', `Question ${qi + 1}`);

  const verdict = el('div');
  verdict.setAttribute('aria-live', 'polite');

  /* In review, the question is presented blank for a genuine retry, but the
     previous answer stays in storage until she actually picks again — so
     opening the review list never erases her record. */
  let retrying = !!opts.retry;
  const saved = S.answers[k];

  mcq.options.forEach((text, oi) => {
    const b = el('button', 'opt');
    b.type = 'button';
    b.append(el('span', 'opt-key', String(oi + 1)));
    b.append(document.createTextNode(text));
    b.onclick = () => pick(oi);
    group.append(b);
  });

  function paint(){
    const a = retrying ? null : S.answers[k];
    const reveal = a && (S.mode === 'learn' || opts.forceReveal || wrap.dataset.checked === '1');
    /* a teacher can show the answer even on a question nobody has attempted */
    const taught = wrap.dataset.showAnswer === '1';

    [...group.children].forEach((b, oi) => {
      b.className = 'opt';
      if(taught && oi === mcq.correct) b.classList.add('right');
      if(!a) return;
      if(reveal){
        if(oi === mcq.correct) b.classList.add('right');
        else if(oi === a.p) b.classList.add('wrong');
        b.disabled = true;
      }else if(oi === a.p){
        b.classList.add('picked');
      }
    });

    verdict.innerHTML = '';
    if(taught && !reveal){
      const v = el('div', 'verdict ok');
      v.append(el('b', null, '\u{1F4A1} The answer is '));
      v.append(el('b', null, mcq.options[mcq.correct]));
      verdict.append(v);
    }
    if(a && reveal){
      const good = a.p === mcq.correct;
      const v = el('div', 'verdict ' + (good ? 'ok' : 'no'));
      if(good){
        v.append(el('b', null, '✓ Correct'));
      }else{
        v.append(el('b', null, '✕ Not quite — '));
        v.append(document.createTextNode('the answer is '));
        v.append(el('b', null, mcq.options[mcq.correct]));
      }
      verdict.append(v);
    }
  }

  function pick(oi){
    /* locked once answered, except on the first retry in the review list */
    if(!retrying && S.answers[k] && (S.mode === 'learn' || wrap.dataset.checked === '1')) return;
    retrying = false;
    S.answers[k] = { p: oi, c: oi === mcq.correct };
    save();
    paint();
    renderOverall();
    if(opts.onAnswer) opts.onAnswer();
  }

  wrap.append(group, verdict);
  wrap._paint = paint;
  wrap._pick  = pick;
  if(saved && opts.forceReveal) wrap.dataset.checked = '1';
  paint();
  return wrap;
}

/* ============================================================
   LESSON VIEW
   ============================================================ */
function renderLesson(si, li){
  const sec = sections()[si];
  if(!sec || !sec.lessons[li]) return goHome();
  const lesson = sec.lessons[li];
  view = { name: 'lesson', si, li };
  S.pos[S.subject] = [si, li];
  save();

  const main = $('#main');
  main.innerHTML = '';
  const panel = el('div', 'panel');

  /* breadcrumb */
  const crumbs = el('div', 'crumbs');
  const home = el('button', 'crumb-btn', subjectName());
  home.onclick = goHome;
  crumbs.append(home, el('span', 'crumb-sep', '›'), el('span', 'crumb-now', sec.name));
  panel.append(crumbs);

  /* title + position */
  const head = el('div', 'lesson-head');
  head.append(el('h2', 'lesson-title', lesson.title));
  head.append(el('span', 'lesson-pos', `Lesson ${li + 1} of ${sec.lessons.length}`));
  panel.append(head);

  /* per-lesson step bar across the section */
  const steps = el('div', 'steps');
  sec.lessons.forEach((l, i) => {
    const allRight = l.mcqs.every((_, qi) => (S.answers[key(si, i, qi)] || {}).c);
    const anyDone  = l.mcqs.some((_, qi) => S.answers[key(si, i, qi)]);
    const s = el('span', 'step' + (i === li ? ' now' : allRight ? ' ok' : anyDone ? ' seen' : ''));
    s.title = l.title;
    steps.append(s);
  });
  panel.append(steps);

  /* rule + example — hidden behind a reveal in Test mode */
  const teach = el('div');
  const fillTeach = () => {
    teach.innerHTML = '';
    const rl = el('div', 'block-label rule-label', 'The rule');
    teach.append(rl, el('div', 'rule', lesson.rule));
    const eg = el('div', 'block-label eg-label', 'Example');
    teach.append(eg, el('div', 'eg', lesson.example));
  };
  if(S.mode === 'test'){
    const box = el('div', 'reveal-box');
    const btn = el('button', 'reveal-btn', '\u{1F441}️  Show the rule and example');
    btn.onclick = () => { box.replaceWith(teach); fillTeach(); };
    box.append(btn);
    panel.append(box);
  }else{
    fillTeach();
    panel.append(teach);
  }

  /* questions */
  const practice = el('div', 'block-label eg-label',
    `Practice · ${lesson.mcqs.length} questions`);
  panel.append(practice);

  const qEls = lesson.mcqs.map((mcq, qi) =>
    questionEl(si, li, qi, mcq, {
      forceReveal: false,
      onAnswer: () => { refreshNav(); if(S.mode === 'learn') jumpToNextUnanswered(); }
    }));
  qEls.forEach(q => panel.append(q));

  /* navigation */
  const nav = el('div', 'lesson-nav');
  const prev = el('button', 'btn ghost', '← Previous');
  prev.disabled = li === 0 && si === 0;
  prev.onclick = () => {
    if(li > 0) return renderLesson(si, li - 1);
    if(si > 0) return renderLesson(si - 1, sections()[si - 1].lessons.length - 1);
  };

  const checkBtn = el('button', 'btn', 'Check answers');
  const nextBtn  = el('button', 'btn',
    li + 1 < sec.lessons.length ? 'Next lesson →' : 'Finish section →');
  nextBtn.onclick = () => {
    if(li + 1 < sec.lessons.length) renderLesson(si, li + 1);
    else renderSectionResults(si);
  };
  checkBtn.onclick = () => {
    const unanswered = lesson.mcqs.filter((_, qi) => !S.answers[key(si, li, qi)]).length;
    if(unanswered){ toast(`${unanswered} question${unanswered > 1 ? 's' : ''} still blank`); return; }
    qEls.forEach(q => { q.dataset.checked = '1'; q._paint(); });
    checkBtn.remove();
    nav.append(nextBtn);
  };

  nav.append(prev);
  const answeredAll = lesson.mcqs.every((_, qi) => S.answers[key(si, li, qi)]);
  const alreadyChecked = S.mode === 'learn' || answeredAll;
  if(S.mode === 'test' && !answeredAll) nav.append(checkBtn);
  else {
    if(S.mode === 'test') qEls.forEach(q => { q.dataset.checked = '1'; q._paint(); });
    nav.append(nextBtn);
  }
  panel.append(nav);

  function refreshNav(){
    if(S.mode !== 'test') return;
    const all = lesson.mcqs.every((_, qi) => S.answers[key(si, li, qi)]);
    checkBtn.classList.toggle('ghost', !all);
  }
  refreshNav();

  /* keyboard hints */
  const keys = el('div', 'keys');
  [['1–4', 'choose an answer'], ['← →', 'change lesson'], ['Esc', 'back to sections']]
    .forEach(([k, what]) => {
      const s = el('span');
      s.append(el('kbd', null, k), document.createTextNode(' ' + what));
      keys.append(s);
    });
  panel.append(keys);

  main.append(panel);
  window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  view.qEls = qEls;
  view.next = nextBtn;
  view.check = checkBtn;
}

/* keyboard answering targets the first still-blank question */
function activeQuestion(){
  if(view.name !== 'lesson') return null;
  return view.qEls.find(q => !S.answers[q.dataset.key]) || null;
}
function jumpToNextUnanswered(){
  const q = activeQuestion();
  if(q && !reduceMotion) q.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/* ============================================================
   SECTION RESULTS
   ============================================================ */
function renderSectionResults(si){
  view = { name: 'results', si };
  const sec = sections()[si];
  const { total, correct } = sectionTotals(si);
  const pct = total ? Math.round((correct / total) * 100) : 0;

  const main = $('#main');
  main.innerHTML = '';
  const panel = el('div', 'panel');

  const crumbs = el('div', 'crumbs');
  const home = el('button', 'crumb-btn', subjectName());
  home.onclick = goHome;
  crumbs.append(home, el('span', 'crumb-sep', '›'), el('span', 'crumb-now', sec.name));
  panel.append(crumbs);

  panel.append(el('div', 'panel-title', sec.name + ' — how it went'));
  const score = el('div', 'score-big', `${correct}/${total}`);
  panel.append(score);

  let note;
  if(pct === 100)     note = '\u{1F31F} Every single one right. Outstanding, Mariam!';
  else if(pct >= 80)  note = '\u{1F3C6} Strong work — you have this section well in hand.';
  else if(pct >= 60)  note = 'Solid progress. Revisit the few you missed and it will stick.';
  else                note = 'Read each rule once more, then retry the ones you missed.';
  panel.append(el('div', 'score-note', `${note} (${pct}%)`));

  const rows = el('div', 'rows');
  sec.lessons.forEach((lesson, li) => {
    let s = 0;
    lesson.mcqs.forEach((_, qi) => { if((S.answers[key(si, li, qi)] || {}).c) s++; });
    const row = el('div', 'row');
    row.style.animationDelay = (0.15 + li * 0.06).toFixed(2) + 's';
    row.append(el('span', null, lesson.title));
    const sc = el('span', 'row-score' + (s === lesson.mcqs.length ? ' full' : ''),
                  `${s}/${lesson.mcqs.length}`);
    row.append(sc);
    row.onclick = () => renderLesson(si, li);
    row.style.cursor = 'pointer';
    rows.append(row);
  });
  panel.append(rows);

  const btns = el('div', 'btn-row');
  const bad = mistakes().filter(m => m.si === si);
  if(bad.length){
    const fix = el('button', 'btn', `Practice the ${bad.length} missed`);
    fix.onclick = renderReview;
    btns.append(fix);
  }
  if(si + 1 < sections().length){
    const nxt = el('button', 'btn' + (bad.length ? ' ghost' : ''),
                   `Next section: ${sections()[si + 1].name} →`);
    nxt.onclick = () => renderLesson(si + 1, 0);
    btns.append(nxt);
  }
  const back = el('button', 'btn ghost', 'All sections');
  back.onclick = goHome;
  btns.append(back);
  panel.append(btns);

  main.append(panel);
  window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
}

/* ============================================================
   REVIEW: just the questions she got wrong
   ============================================================ */
function renderReview(){
  view = { name: 'review' };
  const bad = mistakes();
  const main = $('#main');
  main.innerHTML = '';
  const panel = el('div', 'panel');

  const crumbs = el('div', 'crumbs');
  const home = el('button', 'crumb-btn', subjectName());
  home.onclick = goHome;
  crumbs.append(home, el('span', 'crumb-sep', '›'), el('span', 'crumb-now', 'Practice again'));
  panel.append(crumbs);

  panel.append(el('div', 'panel-title', 'Questions to put right'));

  if(!bad.length){
    panel.append(el('div', 'panel-sub',
      '\u{1F389} Nothing to review — everything you have answered is correct.'));
    const b = el('button', 'btn', 'Back to sections');
    b.onclick = goHome;
    panel.append(b);
    main.append(panel);
    return;
  }

  panel.append(el('div', 'panel-sub',
    `${bad.length} question${bad.length > 1 ? 's' : ''} from ${subjectName()}. Answer again — getting it right clears it from this list.`));

  bad.forEach(({ si, li, qi, mcq, lesson }) => {
    const holder = el('div');
    const tag = el('div', 'block-label eg-label', `${sections()[si].name} · ${lesson.title}`);
    holder.append(tag);
    const q = questionEl(si, li, qi, mcq, {
      retry: true,                /* show it blank, but keep the old answer until she re-picks */
      forceReveal: true,
      onAnswer(){
        renderOverall();
        const a = S.answers[key(si, li, qi)];
        if(a && a.c){ toast('✓ Cleared from your review list'); }
      }
    });
    holder.append(q);
    panel.append(holder);
  });

  const btns = el('div', 'btn-row');
  const again = el('button', 'btn', 'Refresh this list');
  again.onclick = renderReview;
  const back = el('button', 'btn ghost', 'Back to sections');
  back.onclick = goHome;
  btns.append(again, back);
  panel.append(btns);

  main.append(panel);
  window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
}

/* ============================================================
   KEYBOARD
   ============================================================ */
document.addEventListener('keydown', e => {
  if(e.metaKey || e.ctrlKey || e.altKey) return;
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
  if(typing) return;

  if(e.key === 'Escape'){ if(view.name !== 'home') goHome(); return; }

  if(view.name !== 'lesson') return;

  if(e.key >= '1' && e.key <= '9'){
    const q = activeQuestion();
    if(!q) return;
    const idx = +e.key - 1;
    const btn = q.querySelector('.opts').children[idx];
    if(btn && !btn.disabled){ e.preventDefault(); btn.click(); }
    return;
  }
  if(e.key === 'ArrowRight'){ e.preventDefault(); view.next && view.next.click(); }
  if(e.key === 'ArrowLeft'){
    e.preventDefault();
    const { si, li } = view;
    if(li > 0) renderLesson(si, li - 1);
    else if(si > 0) renderLesson(si - 1, sections()[si - 1].lessons.length - 1);
  }
});

/* ============================================================
   BOOT
   ============================================================ */
load();
document.body.classList.toggle('math-theme', S.subject === 'math');
applyTheme();
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if(S.theme === null) applyTheme(); });

$('#themeBtn').onclick  = toggleTheme;
$('#modeLearn').onclick = () => setMode('learn');
$('#modeTest').onclick  = () => setMode('test');
$('#avatar').onclick    = function(){ spinAvatar(this); };
$('#modeLearn').classList.toggle('on', S.mode === 'learn');
$('#modeTest').classList.toggle('on', S.mode === 'test');

buildDecor();
goHome();
