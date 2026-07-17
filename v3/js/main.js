// Boot + game loop + scene manager.
(function () {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  G.initMouse(canvas);

  G.scene = null;
  G.setScene = function (s) {
    G.scene = s;
    if (s.enter) s.enter();
  };

  let progress = 0;
  let loaded = false;
  let fontReady = false;

  // make sure the pixel font is ready before first draw
  if (document.fonts && document.fonts.load) {
    document.fonts.load('30px Wendy').then(() => { fontReady = true; }).catch(() => { fontReady = true; });
    setTimeout(() => { fontReady = true; }, 1500);
  } else {
    fontReady = true;
  }

  G.loadAll(p => { progress = p; }).then(() => { loaded = true; });

  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    if (!loaded || !fontReady) {
      drawLoading(ctx, progress);
    } else {
      if (!G.scene) G.setScene(G.menuScene);
      if (G.scene.update) G.scene.update(dt);
      G.scene.draw(ctx);
    }
    requestAnimationFrame(loop);
  }

  function drawLoading(ctx, p) {
    ctx.fillStyle = '#160604';
    ctx.fillRect(0, 0, 1024, 768);
    // original loading animation frames
    const fr = G.img['load' + (1 + Math.floor(performance.now() / 150) % 6)];
    ctx.imageSmoothingEnabled = false;
    if (fr && fr.width) ctx.drawImage(fr, 512 - 38, 320, 76, 156);
    ctx.fillStyle = '#e8e0d0';
    ctx.font = '28px Wendy, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('LOADING NEUROMANIA... ' + Math.round(p * 100) + '%', 512, 540);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#3d1408';
    ctx.fillRect(362, 560, 300, 10);
    ctx.fillStyle = '#ffd257';
    ctx.fillRect(362, 560, 300 * p, 10);
  }

  requestAnimationFrame(loop);
})();
