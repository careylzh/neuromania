// Main menu: pixel logo, floating neurons, PLAY / difficulty / HELP / ABOUT.
(function () {
  const W = 1024, H = 768;

  const floaters = [];
  for (let i = 0; i < 14; i++) {
    floaters.push({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 30, vy: (Math.random() - 0.5) * 30,
      img: ['good1', 'good2', 'good3', 'bad1', 'bad2'][i % 5],
      s: 0.5 + Math.random() * 1.2, rot: Math.random() * Math.PI * 2
    });
  }

  const buttons = [
    { id: 'play', label: 'PLAY', y: 440 },
    { id: 'diff', label: 'DIFFICULTY: NORMAL', y: 510 },
    { id: 'help', label: 'HOW TO PLAY', y: 580 },
    { id: 'about', label: 'ABOUT', y: 650 }
  ];
  let sel = 0;
  let overlay = null; // 'help' | 'about'

  const HELP_TEXT = [
    'OVERWORLD',
    '  Arrow keys - walk around the map',
    '  E - talk / read signboards / enter places',
    '',
    'MINDPLAY (inside Cody\'s brain)',
    '  Arrow keys - move your consciousness',
    '  Hold Q - CUT bad neuron chains you are touching',
    '  Hold W - BUILD good links (start from a good neuron,',
    '           drag the trail to another good neuron)',
    '',
    'Bad neurons chain toward good thoughts. Cut their chains!',
    'Connect good neurons to strengthen positive thoughts.',
    'Cutting refunds resources; building spends them.',
    'When time runs out, the stronger side decides whether',
    'Cody says NO to drugs. Keep the distribution bar GREY!'
  ];

  const ABOUT_TEXT = [
    'NEUROMANIA',
    'A story by Team Pivotato - SGCC 2014',
    '',
    'Carey Lai Zheng Hui',
    'Chester Koh Boon Hong',
    'Macarius Eng Chern Yu',
    '',
    'A day in the life of Cody, a bullied 16-year-old who',
    'dreams of having friends - and the battle inside his',
    'brain each time drugs come knocking.',
    '',
    'Originally built in Adobe Flash (ActionScript 3).',
    'Lovingly ported to HTML5 canvas in 2026.',
    '',
    'LIFE DOES NOT REWIND. SAY NO TO DRUGS.'
  ];

  const DIFFS = ['easy', 'normal', 'hard'];

  G.menuScene = {
    enter() { overlay = null; },

    update(dt) {
      for (const f of floaters) {
        f.x += f.vx * dt; f.y += f.vy * dt;
        if (f.x < -100) f.x = W + 100; if (f.x > W + 100) f.x = -100;
        if (f.y < -100) f.y = H + 100; if (f.y > H + 100) f.y = -100;
        f.rot += dt * 0.2;
      }
    },

    keyDown(code) {
      if (overlay) {
        if (code === 'Escape' || code === 'KeyE' || code === 'Space' || code === 'Enter') {
          overlay = null;
          G.audio.play('button');
        }
        return;
      }
      if (code === 'ArrowUp') { sel = (sel + buttons.length - 1) % buttons.length; G.audio.play('click', 0.4); }
      if (code === 'ArrowDown') { sel = (sel + 1) % buttons.length; G.audio.play('click', 0.4); }
      if (code === 'Enter' || code === 'Space' || code === 'KeyE') this.activate(buttons[sel].id);
    },

    click(x, y) {
      if (overlay) { overlay = null; G.audio.play('button'); return; }
      for (let i = 0; i < buttons.length; i++) {
        const b = buttons[i];
        if (Math.abs(x - W / 2) < 220 && Math.abs(y - b.y) < 26) {
          sel = i;
          this.activate(b.id);
          return;
        }
      }
    },

    activate(id) {
      G.audio.play('button');
      if (id === 'play') {
        G.setScene(G.overworldScene);
      } else if (id === 'diff') {
        const i = (DIFFS.indexOf(G.save.difficulty) + 1) % DIFFS.length;
        G.save.difficulty = DIFFS[i];
        buttons[1].label = 'DIFFICULTY: ' + G.save.difficulty.toUpperCase();
      } else {
        overlay = id;
      }
    },

    draw(ctx) {
      // background
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#3d1408');
      grad.addColorStop(1, '#160604');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      ctx.save();
      ctx.imageSmoothingEnabled = false;
      for (const f of floaters) {
        const im = G.img[f.img];
        if (!im.width) continue;
        ctx.save();
        ctx.globalAlpha = 0.18;
        ctx.translate(f.x, f.y);
        ctx.rotate(f.rot);
        ctx.drawImage(im, -im.width * f.s / 2, -im.height * f.s / 2, im.width * f.s, im.height * f.s);
        ctx.restore();
      }

      // logo (59x31 pixel art scaled up)
      const logo = G.img.logo;
      if (logo.width) {
        const s = 8;
        ctx.drawImage(logo, (W - logo.width * s) / 2, 110, logo.width * s, logo.height * s);
      }
      ctx.restore();

      ctx.textAlign = 'center';
      ctx.font = '26px Wendy, monospace';
      ctx.fillStyle = '#c9a06a';
      ctx.fillText('A STORY BY TEAM PIVOTATO - SGCC 2014', W / 2, 92);

      if (!overlay) {
        for (let i = 0; i < buttons.length; i++) {
          const b = buttons[i];
          const on = i === sel;
          ctx.font = on ? '42px Wendy, monospace' : '36px Wendy, monospace';
          ctx.fillStyle = on ? '#ffd257' : '#e8e0d0';
          ctx.fillText((on ? '> ' : '') + b.label + (on ? ' <' : ''), W / 2, b.y + 12);
        }
        ctx.font = '22px Wendy, monospace';
        ctx.fillStyle = '#8d7a63';
        ctx.fillText('ARROW KEYS + ENTER, OR CLICK', W / 2, 720);
      } else {
        ctx.fillStyle = 'rgba(10, 8, 6, 0.88)';
        ctx.fillRect(120, 90, W - 240, H - 180);
        ctx.strokeStyle = '#9fe8e0';
        ctx.lineWidth = 3;
        ctx.strokeRect(120, 90, W - 240, H - 180);
        const lines = overlay === 'help' ? HELP_TEXT : ABOUT_TEXT;
        ctx.textAlign = 'left';
        ctx.font = '26px Wendy, monospace';
        for (let i = 0; i < lines.length; i++) {
          ctx.fillStyle = i === 0 ? '#ffd257' : '#e8e0d0';
          ctx.fillText(lines[i], 160, 150 + i * 32);
        }
        ctx.textAlign = 'center';
        ctx.fillStyle = '#9fe8e0';
        ctx.fillText('PRESS E TO CLOSE', W / 2, H - 120);
      }
      ctx.textAlign = 'left';
    }
  };
})();
