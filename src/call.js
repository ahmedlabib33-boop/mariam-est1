/* ============================================================
   Study together — live video/voice call beside the lessons.

   Uses the free Jitsi Meet service (meet.jit.si) through its embed API,
   so there is no server, no account and no API key on our side.
   Note: whoever STARTS a room is asked by Jitsi to sign in once with
   Google / GitHub / Facebook. Anyone joining afterwards does not.
   ============================================================ */

const CALL_HOST   = 'meet.jit.si';
const CALL_SCRIPT = 'https://meet.jit.si/external_api.js';
const NAME_KEY    = 'mariam-est1-callname';

let jitsi   = null;     /* live JitsiMeetExternalAPI instance */
let callRoom = null;

/* A room name on a public server is the only thing protecting the call,
   so make it long and unguessable rather than something like "mariam". */
function newRoomCode(){
  const bytes = new Uint8Array(9);
  crypto.getRandomValues(bytes);
  const tail = [...bytes].map(b => b.toString(36).padStart(2, '0')).join('').slice(0, 14);
  return 'mariam-est1-' + tail;
}

function savedName(){
  try{ return localStorage.getItem(NAME_KEY) || ''; }catch(e){ return ''; }
}
function rememberName(n){
  try{ localStorage.setItem(NAME_KEY, n); }catch(e){}
}

function callLink(room){
  return `${location.origin}${location.pathname}?call=${encodeURIComponent(room)}`;
}

/* load the Jitsi embed script only when a call is actually wanted */
let scriptPromise = null;
function loadJitsi(){
  if(window.JitsiMeetExternalAPI) return Promise.resolve();
  if(scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = CALL_SCRIPT;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => { scriptPromise = null; reject(new Error('script blocked')); };
    document.head.appendChild(s);
  });
  return scriptPromise;
}

/* ---------- panel shell ---------- */
function panel(){
  let p = document.getElementById('callPanel');
  if(p) return p;

  p = el('div', 'call-panel');
  p.id = 'callPanel';
  p.setAttribute('role', 'dialog');
  p.setAttribute('aria-label', 'Study together call');

  const head = el('div', 'call-head');
  head.append(el('span', 'call-dot'));
  head.append(el('span', 'call-title', 'Study together'));

  const acts = el('div', 'call-head-actions');

  const sizeBtn = el('button', 'call-icon', '⤢');
  sizeBtn.title = 'Make bigger or smaller';
  sizeBtn.setAttribute('aria-label', 'Resize call');
  sizeBtn.onclick = () => p.classList.toggle('big');

  const minBtn = el('button', 'call-icon', '–');
  minBtn.title = 'Minimise';
  minBtn.setAttribute('aria-label', 'Minimise call');
  minBtn.onclick = () => {
    p.classList.toggle('min');
    minBtn.textContent = p.classList.contains('min') ? '□' : '–';
  };

  const endBtn = el('button', 'call-icon danger', '✕');
  endBtn.title = 'Leave the call';
  endBtn.setAttribute('aria-label', 'Leave call');
  endBtn.onclick = endCall;

  acts.append(sizeBtn, minBtn, endBtn);
  head.append(acts);

  const body = el('div', 'call-body');
  body.id = 'callBody';

  p.append(head, body);
  document.body.appendChild(p);
  return p;
}

/* ---------- the start / join form ---------- */
function openCallSetup(presetRoom){
  const p = panel();
  p.classList.remove('min');
  const body = document.getElementById('callBody');
  body.innerHTML = '';

  const form = el('div', 'call-setup');
  const joining = !!presetRoom;

  form.append(el('div', 'call-setup-title',
    joining ? 'Join the study call' : 'Start a study call'));
  form.append(el('div', 'call-setup-note', joining
    ? 'Enter your name and join. No account needed.'
    : 'A private room is created just for you two. Share the link to invite Mariam.'));

  const nameWrap = el('label', 'call-field');
  nameWrap.append(el('span', 'call-field-label', 'Your name'));
  const nameInput = el('input', 'call-input');
  nameInput.type = 'text';
  nameInput.placeholder = 'e.g. Ahmed';
  nameInput.value = savedName();
  nameInput.maxLength = 40;
  nameWrap.append(nameInput);
  form.append(nameWrap);

  const room = presetRoom || newRoomCode();

  if(!joining){
    const linkWrap = el('div', 'call-field');
    linkWrap.append(el('span', 'call-field-label', 'Invite link — send this to Mariam'));
    const linkRow = el('div', 'call-link-row');
    const linkInput = el('input', 'call-input');
    linkInput.type = 'text';
    linkInput.readOnly = true;
    linkInput.value = callLink(room);
    linkInput.onclick = () => linkInput.select();
    const copy = el('button', 'btn ghost call-copy', 'Copy');
    copy.onclick = async () => {
      try{
        await navigator.clipboard.writeText(callLink(room));
        copy.textContent = 'Copied ✓';
      }catch(e){
        linkInput.select();
        copy.textContent = 'Press Ctrl+C';
      }
      setTimeout(() => { copy.textContent = 'Copy'; }, 2200);
    };
    linkRow.append(linkInput, copy);
    linkWrap.append(linkRow);
    form.append(linkWrap);

    form.append(el('div', 'call-warn',
      'ℹ️ Jitsi asks whoever starts a room to sign in once (Google, GitHub or Facebook). Mariam will not have to — she just opens the link.'));
  }

  const go = el('button', 'btn wide', joining ? 'Join call' : 'Start call');
  go.onclick = () => {
    const name = nameInput.value.trim() || 'Guest';
    rememberName(name);
    startCall(room, name);
  };
  form.append(go);

  const cancel = el('button', 'btn ghost wide', 'Cancel');
  cancel.style.marginTop = '8px';
  cancel.onclick = closePanel;
  form.append(cancel);

  body.append(form);
  nameInput.focus();
}

/* ---------- live call ---------- */
async function startCall(room, name){
  const body = document.getElementById('callBody');
  body.innerHTML = '';
  body.append(el('div', 'call-loading', 'Connecting…'));

  try{
    await loadJitsi();
  }catch(e){
    body.innerHTML = '';
    const err = el('div', 'call-setup');
    err.append(el('div', 'call-setup-title', 'Could not load the call'));
    err.append(el('div', 'call-setup-note',
      'The Jitsi service could not be reached — a network block, an extension, or no connection. You can still open the room directly:'));
    const a = el('a', 'btn wide', 'Open call in a new tab');
    a.href = 'https://' + CALL_HOST + '/' + room;
    a.target = '_blank';
    a.rel = 'noopener';
    err.append(a);
    const back = el('button', 'btn ghost wide', 'Close');
    back.style.marginTop = '8px';
    back.onclick = closePanel;
    err.append(back);
    body.append(err);
    return;
  }

  body.innerHTML = '';
  callRoom = room;

  jitsi = new JitsiMeetExternalAPI(CALL_HOST, {
    roomName: room,
    parentNode: body,
    width: '100%',
    height: '100%',
    userInfo: { displayName: name },
    configOverwrite: {
      prejoinPageEnabled: false,
      disableDeepLinking: true,          /* stay in the browser on phones */
      startWithAudioMuted: false,
      startWithVideoMuted: false,
      disableThirdPartyRequests: true
    },
    interfaceConfigOverwrite: {
      TOOLBAR_BUTTONS: ['microphone', 'camera', 'desktop', 'tileview',
                        'raisehand', 'chat', 'settings', 'hangup'],
      SHOW_JITSI_WATERMARK: false,
      SHOW_BRAND_WATERMARK: false,
      MOBILE_APP_PROMO: false
    }
  });

  jitsi.addListener('readyToClose', endCall);
  jitsi.addListener('videoConferenceLeft', endCall);

  document.body.classList.add('in-call');
  setCallBtnState(true);
  toast('In a call — lessons still work while you talk');
}

function endCall(){
  if(jitsi){ try{ jitsi.dispose(); }catch(e){} jitsi = null; }
  callRoom = null;
  document.body.classList.remove('in-call');
  setCallBtnState(false);
  closePanel();
}

function closePanel(){
  if(jitsi){ try{ jitsi.dispose(); }catch(e){} jitsi = null; }
  document.body.classList.remove('in-call');
  setCallBtnState(false);
  const p = document.getElementById('callPanel');
  if(p) p.remove();
}

function setCallBtnState(on){
  const b = document.getElementById('callBtn');
  if(!b) return;
  b.classList.toggle('live', on);
  b.setAttribute('aria-label', on ? 'Leave the study call' : 'Start a study call');
  b.title = on ? 'In a call' : 'Study together';
}

/* ---------- wiring ---------- */
function toggleCall(){
  if(jitsi) return endCall();
  if(document.getElementById('callPanel')) return closePanel();
  openCallSetup(null);
}

(function initCall(){
  const btn = document.getElementById('callBtn');
  if(btn) btn.onclick = toggleCall;

  /* arriving on an invite link opens the join form straight away */
  const room = new URLSearchParams(location.search).get('call');
  if(room && /^[A-Za-z0-9._-]{4,80}$/.test(room)) openCallSetup(room);
})();
