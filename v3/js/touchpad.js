// On-screen controls: WASD movement pad + action buttons (Q/W/E/ESC).
// Buttons inject key codes into the same G.keys / scene.keyDown pipeline as
// the physical keyboard. The movement pad is labeled WASD but emits Arrow
// codes — KeyW must stay reserved for "build" in the MindPlay battle.
(function () {
  const press = code => {
    G.audio.unlock();
    if (!G.keys[code]) {
      G.keys[code] = true;
      if (G.scene && G.scene.keyDown) G.scene.keyDown(code);
    }
  };
  const release = code => {
    if (!G.keys[code]) return;
    G.keys[code] = false;
    if (G.scene && G.scene.keyUp) G.scene.keyUp(code);
  };

  const pad = document.createElement('div');
  pad.id = 'touchpad';
  pad.innerHTML = `
    <div id="tp-move">
      <button class="tp-btn" data-code="ArrowUp"    style="grid-area: w">W</button>
      <button class="tp-btn" data-code="ArrowLeft"  style="grid-area: a">A</button>
      <button class="tp-btn" data-code="ArrowDown"  style="grid-area: s">S</button>
      <button class="tp-btn" data-code="ArrowRight" style="grid-area: d">D</button>
    </div>
    <div id="tp-actions">
      <button class="tp-btn tp-act" data-code="Escape"><b>ESC</b><span>MENU</span></button>
      <button class="tp-btn tp-act" data-code="KeyQ"><b>Q</b><span>CUT</span></button>
      <button class="tp-btn tp-act" data-code="KeyW"><b>W</b><span>BUILD</span></button>
      <button class="tp-btn tp-act" data-code="KeyE"><b>E</b><span>OK</span></button>
    </div>`;
  document.body.appendChild(pad);

  // Per-pointer tracking so multi-touch works (e.g. move + hold Q), and so
  // sliding a thumb across the movement pad switches directions.
  const active = {}; // pointerId -> code
  const buttonAt = (x, y) => {
    const el = document.elementFromPoint(x, y);
    return el && el.closest ? el.closest('.tp-btn') : null;
  };
  const setPointer = (id, btn) => {
    const code = btn ? btn.dataset.code : null;
    if (active[id] === code) return;
    if (active[id]) release(active[id]);
    if (code) press(code);
    active[id] = code;
    refresh();
  };
  const refresh = () => {
    const held = new Set(Object.values(active));
    for (const b of pad.querySelectorAll('.tp-btn')) {
      b.classList.toggle('held', held.has(b.dataset.code));
    }
  };

  pad.addEventListener('pointerdown', e => {
    e.preventDefault();
    setPointer(e.pointerId, buttonAt(e.clientX, e.clientY));
  });
  pad.addEventListener('pointermove', e => {
    if (e.pointerId in active) setPointer(e.pointerId, buttonAt(e.clientX, e.clientY));
  });
  const end = e => {
    if (e.pointerId in active) {
      setPointer(e.pointerId, null);
      delete active[e.pointerId];
    }
  };
  pad.addEventListener('pointerup', end);
  pad.addEventListener('pointercancel', end);
  pad.addEventListener('contextmenu', e => e.preventDefault());

  // Visibility: on by default for touch devices, toggleable everywhere.
  const toggle = document.createElement('button');
  toggle.id = 'tp-toggle';
  toggle.textContent = '⌨';
  toggle.title = 'Toggle on-screen controls';
  document.body.appendChild(toggle);

  // Keep the controls clear of the battle HUD, which fills the bottom ~95
  // canvas-pixels; anchor them just above it whatever the canvas scale is.
  const canvas = document.getElementById('game');
  const layout = () => {
    const r = canvas.getBoundingClientRect();
    const lift = (window.innerHeight - r.bottom) + 95 * (r.height / 768);
    pad.style.setProperty('--tp-bottom', Math.max(12, Math.round(lift)) + 'px');
  };
  window.addEventListener('resize', layout);
  layout();

  const saved = localStorage.getItem('nm_touchpad');
  let shown = saved !== null
    ? saved === '1'
    : window.matchMedia('(pointer: coarse)').matches;
  const apply = () => {
    pad.classList.toggle('hidden', !shown);
    toggle.classList.toggle('on', shown);
  };
  toggle.addEventListener('click', () => {
    shown = !shown;
    localStorage.setItem('nm_touchpad', shown ? '1' : '0');
    for (const id in active) { setPointer(id, null); delete active[id]; }
    apply();
  });
  apply();
})();
