// Keyboard + mouse state. G.keys holds currently-held keys by e.code.
(function () {
  G.keys = {};
  G.mouse = { x: 0, y: 0, clicked: false };

  const swallow = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'];

  window.addEventListener('keydown', e => {
    if (swallow.includes(e.code)) e.preventDefault();
    G.audio.unlock();
    if (!G.keys[e.code]) {
      G.keys[e.code] = true;
      if (G.scene && G.scene.keyDown) G.scene.keyDown(e.code);
    }
  });

  window.addEventListener('keyup', e => {
    G.keys[e.code] = false;
    if (G.scene && G.scene.keyUp) G.scene.keyUp(e.code);
  });

  window.addEventListener('blur', () => { G.keys = {}; });

  G.initMouse = function (canvas) {
    const toGame = e => {
      const r = canvas.getBoundingClientRect();
      return {
        x: (e.clientX - r.left) * (canvas.width / r.width),
        y: (e.clientY - r.top) * (canvas.height / r.height)
      };
    };
    canvas.addEventListener('mousemove', e => {
      const p = toGame(e);
      G.mouse.x = p.x; G.mouse.y = p.y;
    });
    canvas.addEventListener('mousedown', e => {
      G.audio.unlock();
      const p = toGame(e);
      G.mouse.x = p.x; G.mouse.y = p.y;
      if (G.scene && G.scene.click) G.scene.click(p.x, p.y);
    });
  };

  // Convenience: is any of these keys held?
  G.held = (...codes) => codes.some(c => G.keys[c]);
})();
