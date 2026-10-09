/* ============================================================
   Teaching tools — only live during a call.

   Everything is sent over Jitsi's own participant data channel
   (sendEndpointTextMessage), so there is still no server of our own.

     Take the lead  — everyone follows your subject / section / lesson
                      and your scrolling
     Laser          — your pointer appears on their screen
     Pen            — draw over the lesson; strokes appear on their screen
     Spotlight      — click anything to flash it on every screen
     Show answer    — reveal a question's answer to everyone at once

   Coordinates are normalised against the lesson panel's width (x AND y),
   so a drawing keeps its shape on a different screen size.
   ============================================================ */

const Teach = (function(){

  let api        = null;    /* the live JitsiMeetExternalAPI */
  let leading    = false;   /* I am driving */
  let followingName = null; /* someone else is driving */
  let tool       = null;    /* null | 'laser' | 'pen' | 'spot' */
  let inkColor   = '#ff3b6b';

  let canvas = null, ctx = null, laserDot = null, bar = null, banner = null;
  let drawing = false, buffer = [], flushTimer = null;
  let lastSelfScroll = 0;

  const COLORS = ['#ff3b6b', '#ffd23f', '#3ddc84', '#4dabff', '#ffffff'];

  /* ---------- transport ---------- */
  function send(msg){
    if(!api) return;
    let people = [];
    try{ people = api.getParticipantsInfo() || []; }catch(e){ return; }
    const me = (() => { try{ return api._myUserID || null; }catch(e){ return null; } })();
    const text = JSON.stringify(msg);
    people.forEach(p => {
      if(!p || !p.participantId || p.participantId === me) return;
      try{ api.executeCommand('sendEndpointTextMessage', p.participantId, text); }catch(e){}
    });
  }

  function onMessage(ev){
    let msg;
    try{ msg = JSON.parse(ev.data.eventData.text); }catch(e){ return; }
    if(!msg || !msg.t) return;
    const who = (ev.data.senderInfo && ev.data.senderInfo.displayName) || 'Your teacher';
    handle(msg, who);
  }

  /* ---------- panel geometry ---------- */
  function panelEl(){ return document.querySelector('#main .panel'); }

  function norm(clientX, clientY){
    const p = panelEl(); if(!p) return null;
    const r = p.getBoundingClientRect();
    return { x: (clientX - r.left) / r.width, y: (clientY - r.top) / r.width };
  }
  function denorm(n){
    const p = panelEl(); if(!p) return null;
    const r = p.getBoundingClientRect();
    return { x: r.left + n.x * r.width, y: r.top + n.y * r.width };
  }

  /* ---------- ink layer ---------- */
  function ensureLayer(){
    const p = panelEl();
    if(!p) return null;
    if(canvas && canvas._host === p && canvas.isConnected) { sizeCanvas(); return canvas; }

    if(canvas) canvas.remove();
    p.style.position = 'relative';
    canvas = document.createElement('canvas');
    canvas.className = 'ink-layer';
    canvas._host = p;
    p.appendChild(canvas);
    ctx = canvas.getContext('2d');
    sizeCanvas();
    return canvas;
  }
  function sizeCanvas(){
    if(!canvas) return;
    const p = canvas._host;
    const w = p.clientWidth, h = p.scrollHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if(canvas.width === Math.round(w*dpr) && canvas.height === Math.round(h*dpr)) return;
    const keep = canvas.width ? canvas.toDataURL() : null;
    canvas.width  = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width  = w + 'px';
    canvas.style.height = h + 'px';
    ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if(keep){ const i = new Image(); i.onload = () => ctx.drawImage(i, 0, 0, w, h); i.src = keep; }
  }

  function strokeSegment(pts, color){
    if(!ensureLayer() || pts.length < 2) return;
    const p = canvas._host, r = p.getBoundingClientRect();
    ctx.strokeStyle = color; ctx.lineWidth = 3;
    ctx.beginPath();
    pts.forEach((pt, i) => {
      const x = pt[0] * r.width;
      const y = pt[1] * r.width;       /* y also scaled by width — keeps the shape */
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    });
    ctx.stroke();
  }
  function clearInk(){
    if(canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  /* ---------- laser ---------- */
  function showLaser(n, who){
    const pos = denorm(n); if(!pos) return;
    if(!laserDot){
      laserDot = document.createElement('div');
      laserDot.className = 'laser-dot';
      document.body.appendChild(laserDot);
    }
    laserDot.style.left = pos.x + 'px';
    laserDot.style.top  = pos.y + 'px';
    laserDot.classList.add('on');
    laserDot.dataset.who = who || '';
    clearTimeout(showLaser._t);
    showLaser._t = setTimeout(hideLaser, 2500);
  }
  function hideLaser(){ if(laserDot) laserDot.classList.remove('on'); }

  /* ---------- spotlight ---------- */
  function spotAt(n){
    const pos = denorm(n); if(!pos) return;
    const ring = document.createElement('div');
    ring.className = 'spot-ring';
    ring.style.left = pos.x + 'px';
    ring.style.top  = pos.y + 'px';
    document.body.appendChild(ring);
    setTimeout(() => ring.remove(), 1400);

    const target = document.elementFromPoint(
      Math.max(0, Math.min(innerWidth - 1, pos.x)),
      Math.max(0, Math.min(innerHeight - 1, pos.y)));
    const block = target && target.closest('.q, .rule, .eg, .lesson-title, .opt');
    if(block){
      block.classList.remove('spot-flash'); void block.offsetWidth;
      block.classList.add('spot-flash');
      setTimeout(() => block.classList.remove('spot-flash'), 2200);
    }
  }

  /* ---------- applying what the leader does ---------- */
  function handle(msg, who){
    switch(msg.t){
      case 'lead':
        if(msg.on){ followingName = who; showBanner(); }
        else { followingName = null; hideBanner(); }
        break;

      case 'nav': {
        if(!followingName) { followingName = who; showBanner(); }
        if(msg.subject && msg.subject !== S.subject){
          S.subject = msg.subject;
          document.body.classList.toggle('math-theme', msg.subject === 'math');
          save();
        }
        clearInk();
        if(msg.kind === 'lesson')      renderLesson(msg.si, msg.li);
        else if(msg.kind === 'results')renderSectionResults(msg.si);
        else if(msg.kind === 'review') renderReview();
        else                           goHome();
        break;
      }

      case 'scroll': {
        if(!followingName) break;
        if(Date.now() - lastSelfScroll < 3000) break;   /* they took over scrolling */
        const max = document.documentElement.scrollHeight - innerHeight;
        window.scrollTo({ top: msg.p * max, behavior: 'smooth' });
        break;
      }

      case 'laser':  msg.off ? hideLaser() : showLaser(msg, who); break;
      case 'spot':   spotAt(msg); break;
      case 'ink':    strokeSegment(msg.pts, msg.c); break;
      case 'ink-clear': clearInk(); break;

      case 'reveal': {
        if(typeof msg.k !== 'string') break;
        const q = [...document.querySelectorAll('.q')].find(x => x.dataset.key === msg.k);
        if(q){ q.dataset.showAnswer = '1'; q._paint && q._paint();
               q.scrollIntoView({ behavior:'smooth', block:'center' }); }
        break;
      }
    }
  }

  /* ---------- follower banner ---------- */
  function showBanner(){
    if(banner) { banner.querySelector('.fb-name').textContent = followingName; return; }
    banner = document.createElement('div');
    banner.className = 'follow-banner';
    const dot = document.createElement('span'); dot.className = 'fb-dot';
    const txt = document.createElement('span');
    txt.append(document.createTextNode('Following '));
    const nm = document.createElement('b'); nm.className = 'fb-name'; nm.textContent = followingName;
    txt.append(nm);
    const stop = document.createElement('button'); stop.className = 'fb-stop'; stop.textContent = 'Stop';
    stop.onclick = () => { followingName = null; hideBanner(); };
    banner.append(dot, txt, stop);
    document.body.appendChild(banner);
  }
  function hideBanner(){ if(banner){ banner.remove(); banner = null; } }

  /* ---------- broadcasting my own navigation ---------- */
  let origLesson, origHome, origResults, origReview;
  function hookNav(){
    if(origLesson) return;
    origLesson  = window.renderLesson;
    origHome    = window.goHome;
    origResults = window.renderSectionResults;
    origReview  = window.renderReview;

    window.renderLesson = function(si, li){
      origLesson.apply(this, arguments);
      clearInk();
      if(leading) send({ t:'nav', kind:'lesson', subject:S.subject, si, li });
    };
    window.goHome = function(){
      origHome.apply(this, arguments);
      clearInk();
      if(leading) send({ t:'nav', kind:'home', subject:S.subject });
    };
    window.renderSectionResults = function(si){
      origResults.apply(this, arguments);
      if(leading) send({ t:'nav', kind:'results', subject:S.subject, si });
    };
    window.renderReview = function(){
      origReview.apply(this, arguments);
      if(leading) send({ t:'nav', kind:'review', subject:S.subject });
    };
  }
  function unhookNav(){
    if(!origLesson) return;
    window.renderLesson = origLesson; window.goHome = origHome;
    window.renderSectionResults = origResults; window.renderReview = origReview;
    origLesson = origHome = origResults = origReview = null;
  }

  /* ---------- pointer handling for laser / pen / spotlight ---------- */
  function onPointerDown(e){
    if(!leading || !tool) return;
    /* target may not be an Element (document/window), so guard before .closest */
    const t = e.target;
    if(t && t.closest && t.closest('#callPanel, .teach-bar')) return;

    if(tool === 'spot'){
      const n = norm(e.clientX, e.clientY);
      if(n){ spotAt(n); send(Object.assign({ t:'spot' }, n)); }
      return;
    }
    if(tool === 'pen'){
      e.preventDefault();
      drawing = true; buffer = [];
      pushPoint(e);
    }
  }
  function onPointerMove(e){
    if(!leading || !tool) return;
    if(tool === 'laser'){
      const n = norm(e.clientX, e.clientY);
      if(!n) return;
      showLaser(n, 'me');
      throttleSend(() => send(Object.assign({ t:'laser' }, n)));
      return;
    }
    if(tool === 'pen' && drawing){ e.preventDefault(); pushPoint(e); }
  }
  function onPointerUp(){
    if(tool === 'pen' && drawing){ flush(true); drawing = false; }
  }
  function pushPoint(e){
    const n = norm(e.clientX, e.clientY);
    if(!n) return;
    buffer.push([+n.x.toFixed(4), +n.y.toFixed(4)]);
    if(buffer.length >= 2){
      strokeSegment(buffer.slice(-2), inkColor);
    }
    if(!flushTimer) flushTimer = setTimeout(() => flush(false), 70);
  }
  function flush(end){
    clearTimeout(flushTimer); flushTimer = null;
    if(buffer.length >= 2) send({ t:'ink', pts: buffer.slice(), c: inkColor });
    buffer = end ? [] : buffer.slice(-1);
  }
  let throttleAt = 0;
  function throttleSend(fn){
    const now = Date.now();
    if(now - throttleAt < 90) return;
    throttleAt = now; fn();
  }

  /* my scrolling drives theirs while I lead */
  let scrollAt = 0;
  function onScroll(){
    lastSelfScroll = Date.now();
    if(!leading) return;
    const now = Date.now();
    if(now - scrollAt < 220) return;
    scrollAt = now;
    const max = document.documentElement.scrollHeight - innerHeight;
    send({ t:'scroll', p: max > 0 ? window.scrollY / max : 0 });
  }

  /* ---------- the toolbar ---------- */
  function buildBar(){
    if(bar) return;
    bar = document.createElement('div');
    bar.className = 'teach-bar';

    const lead = mkBtn('\u{1F393}', 'Take the lead', () => setLeading(!leading));
    lead.id = 'teachLead';
    bar.append(lead);

    bar.append(mkSep());

    const laser = mkBtn('\u{1F526}', 'Laser pointer', () => setTool(tool === 'laser' ? null : 'laser'));
    laser.dataset.tool = 'laser';
    const pen = mkBtn('✏️', 'Draw on the lesson', () => setTool(tool === 'pen' ? null : 'pen'));
    pen.dataset.tool = 'pen';
    const spot = mkBtn('\u{1F3AF}', 'Spotlight what you click', () => setTool(tool === 'spot' ? null : 'spot'));
    spot.dataset.tool = 'spot';
    bar.append(laser, pen, spot);

    const swatches = document.createElement('div');
    swatches.className = 'ink-colors';
    COLORS.forEach(c => {
      const s = document.createElement('button');
      s.className = 'swatch' + (c === inkColor ? ' on' : '');
      s.style.background = c;
      s.title = 'Pen colour';
      s.onclick = () => {
        inkColor = c;
        [...swatches.children].forEach(x => x.classList.toggle('on', x === s));
      };
      swatches.append(s);
    });
    bar.append(swatches);

    const wipe = mkBtn('\u{1F9F9}', 'Clear drawing', () => { clearInk(); send({ t:'ink-clear' }); });
    bar.append(wipe);

    const reveal = mkBtn('\u{1F4A1}', 'Show this answer to everyone', revealCurrent);
    bar.append(reveal);

    document.body.appendChild(bar);
    syncBar();
  }
  function mkBtn(glyph, title, fn){
    const b = document.createElement('button');
    b.className = 'teach-btn'; b.textContent = glyph;
    b.title = title; b.setAttribute('aria-label', title);
    b.onclick = fn;
    return b;
  }
  function mkSep(){ const s = document.createElement('span'); s.className = 'teach-sep'; return s; }

  function syncBar(){
    if(!bar) return;
    bar.classList.toggle('leading', leading);
    const lead = bar.querySelector('#teachLead');
    lead.classList.toggle('on', leading);
    lead.title = leading ? 'Stop leading' : 'Take the lead';
    bar.querySelectorAll('[data-tool]').forEach(b =>
      b.classList.toggle('on', leading && tool === b.dataset.tool));
  }

  function setLeading(on){
    leading = on;
    if(!on) setTool(null);
    send({ t:'lead', on });
    if(on){
      followingName = null; hideBanner();
      send({ t:'nav',
             kind: view.name === 'lesson' ? 'lesson' : view.name === 'results' ? 'results'
                 : view.name === 'review' ? 'review' : 'home',
             subject: S.subject, si: view.si, li: view.li });
      toast('You are leading — everyone follows your screen');
    }else{
      toast('You stopped leading');
    }
    syncBar();
  }
  function setTool(t){
    if(t && !leading) setLeading(true);
    tool = t;
    document.body.classList.toggle('pen-on', t === 'pen');
    document.body.classList.toggle('tool-on', !!t);
    if(t === 'pen') ensureLayer();
    syncBar();
  }

  function revealCurrent(){
    const q = document.querySelector('.q');
    if(!q){ toast('Open a lesson first'); return; }
    const target = [...document.querySelectorAll('.q')].find(x => {
      const r = x.getBoundingClientRect();
      return r.bottom > 0 && r.top < innerHeight;
    }) || q;
    target.dataset.showAnswer = '1';
    target._paint && target._paint();
    send({ t:'reveal', k: target.dataset.key });
    toast('Answer shown to everyone');
  }

  /* ---------- lifecycle ---------- */
  function attach(a){
    api = a;
    api.addListener('endpointTextMessageReceived', onMessage);
    hookNav();
    buildBar();
    addEventListener('pointerdown', onPointerDown, true);
    addEventListener('pointermove', onPointerMove, true);
    addEventListener('pointerup', onPointerUp, true);
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', sizeCanvas);
  }
  function detach(){
    if(api){ try{ api.removeListener('endpointTextMessageReceived', onMessage); }catch(e){} }
    api = null; leading = false; followingName = null; tool = null;
    document.body.classList.remove('pen-on', 'tool-on');
    unhookNav();
    hideBanner(); hideLaser(); clearInk();
    if(canvas){ canvas.remove(); canvas = null; ctx = null; }
    if(bar){ bar.remove(); bar = null; }
    removeEventListener('pointerdown', onPointerDown, true);
    removeEventListener('pointermove', onPointerMove, true);
    removeEventListener('pointerup', onPointerUp, true);
    removeEventListener('scroll', onScroll);
    removeEventListener('resize', sizeCanvas);
  }

  return { attach, detach,
           get leading(){ return leading; },
           get following(){ return followingName; },
           _send: send, _handle: handle, _setTool: setTool, _setLeading: setLeading };
})();

window.Teach = Teach;
