// MindPlay: the brain simulation battle, ported from badNeuron.as /
// goodNeuron.as / gChainM.as. Bad neurons build chains toward good thoughts;
// the player's consciousness cuts them (Q) and builds good links (W/E).
(function () {
  const W = 1024, H = 768;
  const WORLDW = 2048, WORLDH = 1536; // "The map size is 2048 by 1536" (design doc)
  const LINK_SPACING = 30;
  const PSPEED = 360;

  let bg = null; // prerendered brain background

  function makeBackground() {
    bg = document.createElement('canvas');
    bg.width = WORLDW; bg.height = WORLDH;
    const c = bg.getContext('2d');
    c.fillStyle = '#63291a';
    c.fillRect(0, 0, WORLDW, WORLDH);
    // faded neuron silhouettes, per the design doc
    c.imageSmoothingEnabled = false;
    const imgs = ['good1', 'good2', 'good3', 'bad1', 'bad2'];
    let seed = 42;
    const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    for (let i = 0; i < 46; i++) {
      const im = G.img[imgs[i % imgs.length]];
      if (!im.width) continue;
      const s = 1 + rnd() * 3.2;
      c.globalAlpha = 0.05 + rnd() * 0.08;
      c.drawImage(im, rnd() * WORLDW - 100, rnd() * WORLDH - 100, im.width * s, im.height * s);
    }
    c.globalAlpha = 0.06;
    c.fillStyle = '#ffffff';
    for (let i = 0; i < 900; i++) c.fillRect(rnd() * WORLDW, rnd() * WORLDH, 2, 2);
    c.globalAlpha = 1;
  }

  const bt = {
    kind: 'glue',
    phase: 'brief',   // brief | play | over
    time: 0, timeLeft: 60,
    res: 0,
    px: 0, py: 0, dir: 'down', moving: false, animT: 0,
    camX: 0, camY: 0,
    goods: [], bads: [], goodChains: [], trail: null,
    conscience: '', conscienceT: 0, conscienceTick: 0,
    tutorial: false, tutT: 0,
    won: false, overT: 0,
    cutCool: 0, buildCool: 0,

    begin(kind) {
      if (!bg) makeBackground();
      this.kind = kind;
      this.phase = 'brief';
      this.time = 0;
      this.overT = 0;
      this.trail = null;
      this.goodChains = [];
      this.conscience = ''; this.conscienceT = 0; this.conscienceTick = 0;
      this.tutorial = !G.save.glueDone && !G.save.partyDone;
      this.tutT = 0;

      const diff = G.save.difficulty;
      const h = G.save.handicap;
      this.timeLeft = (diff === 'easy' ? 70 : diff === 'hard' ? 50 : 60);
      this.res = Math.max(30, (diff === 'easy' ? 85 : diff === 'hard' ? 45 : 60) - h * 10);
      const badCount = (kind === 'glue' ? 3 : 4) + (h > 0 ? 1 : 0);
      const buildIv = Math.max(0.35, (diff === 'easy' ? 0.95 : diff === 'hard' ? 0.55 : 0.75) - h * 0.08);

      // scatter good neurons
      this.goods = [];
      const gpos = [
        [420, 380], [1500, 320], [1024, 820], [380, 1150], [1600, 1180], [1024, 300]
      ].slice(0, kind === 'glue' ? 5 : 6);
      gpos.forEach((p, i) => this.goods.push({
        x: p[0], y: p[1], img: 'good' + (1 + i % 3), r: 95, connected: false
      }));

      // bad neurons around the edges (per badNeuron.as: random 1-5s init delay)
      this.bads = [];
      const bpos = [[160, 160], [1880, 200], [200, 1380], [1860, 1360], [1024, 1450]];
      for (let i = 0; i < badCount; i++) {
        this.bads.push({
          x: bpos[i][0], y: bpos[i][1], img: 'bad' + (1 + i % 2), r: 70,
          state: 'waiting', wait: 1 + Math.random() * 4,
          target: null, links: [], buildT: 0, buildIv,
          completeT: 0, strength: 0, glowIdx: 0, glowT: 0
        });
      }

      this.px = WORLDW / 2; this.py = WORLDH / 2 + 100;
      this.dir = 'down';
      G.setScene(this);
      G.audio.music('music', 0.25);
    },

    totalGood() {
      let t = 0;
      for (const c of this.goodChains) t += c.strength;
      return t;
    },
    totalBad() {
      let t = 0;
      for (const b of this.bads) t += b.strength;
      return t;
    },

    keyDown(code) {
      if (this.phase === 'brief' && (code === 'Space' || code === 'Enter' || code === 'KeyE')) {
        this.phase = 'play';
        G.audio.play('button');
      }
    },
    click() { this.keyDown('Space'); },

    update(dt) {
      if (this.phase === 'brief') return;
      if (this.phase === 'over') {
        this.overT += dt;
        if (this.overT > 3) {
          G.audio.stopMusic();
          G.overworldScene.battleFinished(this.kind, this.won);
        }
        return;
      }

      this.time += dt;
      this.tutT += dt;
      this.timeLeft -= dt;
      if (this.cutCool > 0) this.cutCool -= dt;
      if (this.buildCool > 0) this.buildCool -= dt;
      if (this.conscienceT > 0) this.conscienceT -= dt;

      // player movement
      let dx = 0, dy = 0;
      if (G.held('ArrowLeft')) dx -= 1;
      if (G.held('ArrowRight')) dx += 1;
      if (G.held('ArrowUp')) dy -= 1;
      if (G.held('ArrowDown')) dy += 1;
      this.moving = dx !== 0 || dy !== 0;
      if (this.moving) {
        if (dy < 0) this.dir = dx < 0 ? 'upleft' : dx > 0 ? 'upright' : 'up';
        else if (dy > 0) this.dir = dx < 0 ? 'downleft' : dx > 0 ? 'downright' : 'down';
        else this.dir = dx < 0 ? 'left' : 'right';
        const len = Math.hypot(dx, dy);
        this.px = Math.max(30, Math.min(WORLDW - 30, this.px + (dx / len) * PSPEED * dt));
        this.py = Math.max(50, Math.min(WORLDH - 20, this.py + (dy / len) * PSPEED * dt));
        this.animT += dt;
      } else {
        this.animT += dt * 0.4;
      }

      this.updateBads(dt);
      this.updateGoodBuilding(dt);
      if (G.held('KeyQ')) this.tryCut();

      // conscience dialogue, from the Simulation Concept doc
      this.conscienceTick += dt;
      if (this.conscienceTick > 6) {
        this.conscienceTick = 0;
        const g = this.totalGood(), b = this.totalBad();
        if (b > g) this.say("NOOOO! I'VE GOT TO FIGHT THE FEAR! I CAN'T LIVE A LIFE OF DRUGS!");
        else if (g > 0 && b === 0) this.say('NEVER DRUGS NEVER!!!');
        else this.say("Yes that's right! Life does not rewind! I've got to fight it!");
      }

      // camera
      this.camX = Math.max(0, Math.min(WORLDW - W, this.px - W / 2));
      this.camY = Math.max(0, Math.min(WORLDH - H, this.py - H / 2));

      if (this.timeLeft <= 0) {
        this.phase = 'over';
        this.won = this.totalGood() >= this.totalBad();
        G.audio.stopMusic();
        G.audio.play(this.won ? 'win' : 'lose', 0.7);
      }
    },

    say(t) { this.conscience = t; this.conscienceT = 3.5; },

    updateBads(dt) {
      for (const b of this.bads) {
        if (b.state === 'waiting') {
          b.wait -= dt;
          if (b.wait <= 0) {
            // findGN(): pick a random good neuron
            b.target = this.goods[Math.floor(Math.random() * this.goods.length)];
            b.state = 'building';
            b.buildT = 0;
          }
        } else if (b.state === 'building') {
          b.buildT += dt;
          if (b.buildT >= b.buildIv) {
            b.buildT = 0;
            const n = b.links.length + 1;
            const ang = Math.atan2(b.target.y - b.y, b.target.x - b.x);
            const lx = b.x + Math.cos(ang) * (b.r + n * LINK_SPACING);
            const ly = b.y + Math.sin(ang) * (b.r + n * LINK_SPACING);
            b.links.push({ x: lx, y: ly, a: ang });
            if (Math.hypot(lx - b.target.x, ly - b.target.y) < b.target.r) {
              b.state = 'complete';
              b.completeT = 0;
              G.audio.play('alarm', 0.25);
              this.say('AH! A bad thought took hold! CUT ITS CHAIN! (hold Q on it)');
            }
          }
        } else if (b.state === 'complete') {
          b.completeT += dt;
          // strengthTimed(): strength = chainLength * seconds
          b.strength = b.links.length * (1 + Math.floor(b.completeT));
          b.glowT += dt;
          if (b.glowT > 0.1) { b.glowT = 0; b.glowIdx = (b.glowIdx + 1) % Math.max(1, b.links.length); }
        }
      }
    },

    tryCut() {
      if (this.cutCool > 0) return;
      for (const b of this.bads) {
        for (let i = 0; i < b.links.length; i++) {
          const l = b.links[i];
          if (Math.hypot(l.x - this.px, l.y - (this.py - 30)) < 46) {
            // cutChain(i): refund a resource per broken link
            const removed = b.links.length - i;
            this.res += removed;
            b.links.splice(i);
            b.strength = 0;
            b.completeT = 0;
            if (i === 0) {
              b.state = 'waiting';
              b.wait = 1 + Math.random() * 4;
            } else {
              b.state = 'building';
              b.buildT = -0.4; // brief stun before rebuilding
            }
            G.audio.play('break', 0.6);
            this.cutCool = 0.12;
            return;
          }
        }
      }
    },

    updateGoodBuilding(dt) {
      const holding = G.held('KeyW') || G.held('KeyE');
      if (!holding) return;
      if (this.buildCool > 0) return;

      const hx = this.px, hy = this.py - 30;

      if (!this.trail) {
        // must start from a good neuron
        for (const g of this.goods) {
          if (Math.hypot(hx - g.x, hy - g.y) < g.r + 30) {
            this.trail = { start: g, links: [], lx: g.x, ly: g.y };
            break;
          }
        }
        if (!this.trail) return;
      }

      const t = this.trail;
      if (Math.hypot(hx - t.lx, hy - t.ly) >= LINK_SPACING) {
        if (this.res <= 0) { this.say('OUT OF RESOURCES! Cut bad chains (Q) to recover some!'); this.buildCool = 1.5; return; }
        // too far from the trail end? can't continue from here
        if (Math.hypot(hx - t.lx, hy - t.ly) > LINK_SPACING * 3) return;
        this.res--;
        t.links.push({ x: hx, y: hy });
        t.lx = hx; t.ly = hy;
        // completed a connection to a different good neuron?
        for (const g of this.goods) {
          if (g !== t.start && Math.hypot(hx - g.x, hy - g.y) < g.r + 10) {
            this.goodChains.push({
              start: t.start, end: g, links: t.links,
              completeT: 0, strength: Math.max(1, t.links.length), glowIdx: 0, glowT: 0
            });
            t.start.connected = g.connected = true;
            this.trail = null;
            G.audio.play('star', 0.5);
            this.say('YES! A positive thought grows stronger!');
            return;
          }
        }
      }
    },

    draw(ctx) {
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(bg, -this.camX, -this.camY);

      const t = performance.now();

      // completed good chains: strengthen over time + blue glow cycle
      for (const c of this.goodChains) {
        c.completeT = (c.completeT || 0) + 1 / 60;
        c.strength = c.links.length * (1 + Math.floor(c.completeT));
        c.glowT += 1 / 60;
        if (c.glowT > 0.08) { c.glowT = 0; c.glowIdx = (c.glowIdx + 1) % Math.max(1, c.links.length); }
        for (let i = 0; i < c.links.length; i++) this.drawGoodLink(ctx, c.links[i], i === c.glowIdx);
      }
      // active trail
      if (this.trail) for (const l of this.trail.links) this.drawGoodLink(ctx, l, false, true);

      // bad chains
      for (const b of this.bads) {
        for (let i = 0; i < b.links.length; i++) {
          const l = b.links[i];
          const isHead = b.state === 'building' && i >= b.links.length - 2;
          const glow = b.state === 'complete' && i === b.glowIdx;
          this.drawBadLink(ctx, l, isHead, glow);
        }
      }

      // good neurons
      for (const g of this.goods) {
        const im = G.img[g.img];
        const pulse = 1 + Math.sin(t / 400 + g.x) * 0.04;
        const s = (g.r * 2 / im.width) * pulse;
        if (g.connected) {
          ctx.save();
          ctx.shadowColor = '#4488ff';
          ctx.shadowBlur = 30;
          ctx.drawImage(im, g.x - this.camX - im.width * s / 2, g.y - this.camY - im.height * s / 2, im.width * s, im.height * s);
          ctx.restore();
        } else {
          ctx.drawImage(im, g.x - this.camX - im.width * s / 2, g.y - this.camY - im.height * s / 2, im.width * s, im.height * s);
        }
      }

      // bad neurons
      for (const b of this.bads) {
        const im = G.img[b.img];
        const pulse = 1 + Math.sin(t / 250 + b.y) * 0.06;
        const s = (b.r * 2 / im.width) * pulse;
        ctx.save();
        if (b.state === 'complete') {
          ctx.shadowColor = '#ff2222';
          ctx.shadowBlur = 25 + Math.sin(t / 120) * 10;
        }
        ctx.drawImage(im, b.x - this.camX - im.width * s / 2, b.y - this.camY - im.height * s / 2, im.width * s, im.height * s);
        ctx.restore();
      }

      // player consciousness: Cody + orange orb (like the original screenshot)
      const orbX = this.px - this.camX + 24, orbY = this.py - this.camY - 18;
      const orbR = 22 + Math.sin(t / 180) * 3;
      const og = ctx.createRadialGradient(orbX, orbY, 2, orbX, orbY, orbR);
      og.addColorStop(0, 'rgba(255, 220, 140, 0.95)');
      og.addColorStop(1, 'rgba(255, 160, 40, 0)');
      ctx.fillStyle = og;
      ctx.beginPath();
      ctx.arc(orbX, orbY, orbR, 0, Math.PI * 2);
      ctx.fill();

      const set = this.moving ? 'walk' : 'idle';
      const count = this.moving ? 6 : 2;
      const fr = 1 + (Math.floor(this.animT * (this.moving ? 10 : 3)) % count);
      const sp = G.img[`cody_${set}_${this.dir}_${fr}`] || G.img.cody_idle_down_1;
      if (sp && sp.width) {
        const s = 2;
        ctx.drawImage(sp, Math.round(this.px - this.camX - sp.width * s / 2), Math.round(this.py - this.camY - sp.height * s), sp.width * s, sp.height * s);
      }

      this.drawHUD(ctx);

      if (this.phase === 'brief') this.drawBrief(ctx);
      if (this.phase === 'over') this.drawOver(ctx);
      ctx.restore();
    },

    drawBadLink(ctx, l, isHead, glow) {
      const x = l.x - this.camX, y = l.y - this.camY;
      if (x < -40 || y < -40 || x > W + 40 || y > H + 40) return;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(l.a);
      if (isHead) {
        // forming: orange dotted (like the original "forming link")
        ctx.fillStyle = '#f0c070';
        ctx.strokeStyle = '#7a4a10';
        ctx.lineWidth = 2;
        ctx.fillRect(-7, -7, 14, 14);
        ctx.strokeRect(-7, -7, 14, 14);
      } else {
        // formed: white ladder link
        if (glow) {
          ctx.shadowColor = '#ff2222';
          ctx.shadowBlur = 18;
        }
        ctx.fillStyle = glow ? '#ffb0b0' : '#f2f2f2';
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 2;
        ctx.fillRect(-13, -8, 26, 16);
        ctx.strokeRect(-13, -8, 26, 16);
        ctx.strokeStyle = '#999';
        ctx.beginPath();
        ctx.moveTo(0, -8); ctx.lineTo(0, 8);
        ctx.stroke();
      }
      ctx.restore();
    },

    drawGoodLink(ctx, l, glow, forming) {
      const x = l.x - this.camX, y = l.y - this.camY;
      if (x < -40 || y < -40 || x > W + 40 || y > H + 40) return;
      ctx.save();
      if (glow) {
        ctx.shadowColor = '#4488ff';
        ctx.shadowBlur = 16;
      }
      ctx.fillStyle = forming ? 'rgba(255, 200, 120, 0.8)' : '#ffb04a';
      ctx.strokeStyle = '#6e3c0c';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, forming ? 6 : 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    },

    drawHUD(ctx) {
      const g = this.totalGood(), b = this.totalBad();

      // bottom panels, echoing the original screenshot
      ctx.fillStyle = 'rgba(140, 215, 195, 0.85)';
      ctx.strokeStyle = '#1f4f46';
      ctx.lineWidth = 3;
      ctx.fillRect(20, H - 90, 300, 70); ctx.strokeRect(20, H - 90, 300, 70);
      ctx.fillRect(W - 380, H - 90, 360, 70); ctx.strokeRect(W - 380, H - 90, 360, 70);

      ctx.fillStyle = '#0e2e28';
      ctx.font = '26px Wendy, monospace';
      ctx.fillText('RESOURCES REMAINING:', 36, H - 62);
      ctx.font = '34px Wendy, monospace';
      ctx.fillText(String(this.res), 36, H - 30);

      // time pentagon
      ctx.save();
      ctx.translate(W / 2, H - 55);
      ctx.fillStyle = 'rgba(150, 160, 150, 0.9)';
      ctx.strokeStyle = '#c03030';
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + i * Math.PI * 2 / 5;
        const px = Math.cos(a) * 58, py = Math.sin(a) * 58;
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.textAlign = 'center';
      ctx.fillStyle = '#222';
      ctx.font = '24px Wendy, monospace';
      ctx.fillText('TIME', 0, -12);
      ctx.fillStyle = '#c01818';
      ctx.font = '38px Wendy, monospace';
      ctx.fillText(String(Math.max(0, Math.ceil(this.timeLeft))), 0, 26);
      ctx.restore();

      // neuron link distribution bar
      ctx.fillStyle = '#0e2e28';
      ctx.font = '24px Wendy, monospace';
      ctx.fillText('NEURON LINK DISTRIBUTION', W - 360, H - 64);
      const bx = W - 330, by = H - 52, bw = 260, bh = 20;
      const grad = ctx.createLinearGradient(bx, 0, bx + bw, 0);
      grad.addColorStop(0, '#ff9a2a');
      grad.addColorStop(1, '#f0f0f0');
      ctx.fillStyle = grad;
      ctx.fillRect(bx, by, bw, bh);
      ctx.strokeStyle = '#1f4f46';
      ctx.strokeRect(bx, by, bw, bh);
      // marker: left = bad (orange), right = good (white)
      const ratio = (g + b) === 0 ? 0.5 : g / (g + b);
      const mx = bx + ratio * bw;
      ctx.fillStyle = '#c01818';
      ctx.beginPath();
      ctx.moveTo(mx - 7, by - 10); ctx.lineTo(mx + 7, by - 10); ctx.lineTo(mx, by + 2);
      ctx.closePath(); ctx.fill();
      const badIm = G.img.bad1, goodIm = G.img.good1;
      if (badIm.width) ctx.drawImage(badIm, bx - 44, by - 14, 40, 40);
      if (goodIm.width) ctx.drawImage(goodIm, bx + bw + 6, by - 14, 40, 40);

      // conscience bubble
      if (this.conscienceT > 0) {
        ctx.font = '28px Wendy, monospace';
        ctx.textAlign = 'center';
        const tw = ctx.measureText(this.conscience).width;
        ctx.fillStyle = 'rgba(255,255,255,0.92)';
        ctx.fillRect(W / 2 - tw / 2 - 18, 24, tw + 36, 46);
        ctx.strokeStyle = '#333';
        ctx.strokeRect(W / 2 - tw / 2 - 18, 24, tw + 36, 46);
        ctx.fillStyle = '#8a1818';
        ctx.fillText(this.conscience, W / 2, 56);
        ctx.textAlign = 'left';
      }

      // tutorial hints (first battle only)
      if (this.tutorial && this.phase === 'play') {
        let hint = null;
        if (this.tutT < 6) hint = 'ARROW KEYS - move your consciousness around the brain!';
        else if (this.tutT < 13) hint = 'Hold Q while touching a chain to CUT bad thoughts!';
        else if (this.tutT < 20) hint = 'Hold W from a WHITE neuron and walk to another to BUILD good bonds!';
        if (hint) {
          ctx.font = '26px Wendy, monospace';
          ctx.textAlign = 'center';
          ctx.fillStyle = '#ffe9a0';
          ctx.fillText(hint, W / 2, 110);
          ctx.textAlign = 'left';
        }
      }
    },

    drawBrief(ctx) {
      ctx.fillStyle = 'rgba(10, 5, 3, 0.82)';
      ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ff8a5a';
      ctx.font = '52px Wendy, monospace';
      ctx.fillText('ENTERING CODY\'S BRAIN...', W / 2, 160);
      ctx.fillStyle = '#fff';
      ctx.font = '30px Wendy, monospace';
      const lines = [
        this.kind === 'glue'
          ? 'Cody is being pressured to sniff glue!'
          : 'Cody is being pressured to take ecstasy!',
        '',
        'Bad (orange) neurons will chain toward good (white) thoughts.',
        'ARROWS - move    HOLD Q - cut bad chains (refunds resources)',
        'HOLD W - build good links between white neurons (costs resources)',
        '',
        'When the timer ends, the stronger side wins Cody\'s mind.',
        'Keep the NEURON LINK DISTRIBUTION on the white side!'
      ];
      lines.forEach((l, i) => ctx.fillText(l, W / 2, 260 + i * 44));
      ctx.fillStyle = '#ffd257';
      if (Math.floor(performance.now() / 400) % 2 === 0) {
        ctx.font = '36px Wendy, monospace';
        ctx.fillText('PRESS SPACE TO FIGHT FOR CODY\'S MIND', W / 2, 660);
      }
      ctx.textAlign = 'left';
    },

    drawOver(ctx) {
      const a = Math.min(0.75, this.overT);
      ctx.fillStyle = `rgba(0,0,0,${a})`;
      ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center';
      ctx.font = '64px Wendy, monospace';
      ctx.fillStyle = this.won ? '#7cf78c' : '#ff6a6a';
      ctx.fillText(this.won ? 'CODY SAYS NO!' : 'CODY GIVES IN...', W / 2, 340);
      ctx.font = '30px Wendy, monospace';
      ctx.fillStyle = '#fff';
      const g = Math.round(this.totalGood()), b = Math.round(this.totalBad());
      ctx.fillText(`GOOD THOUGHTS: ${g}    BAD THOUGHTS: ${b}`, W / 2, 410);
      ctx.fillStyle = '#ffd257';
      ctx.fillText(this.won ? 'STRONG MIND! LIFE DOES NOT REWIND!' : 'Oh no... this cannot be undone.', W / 2, 470);
      ctx.textAlign = 'left';
    }
  };

  G.battleScene = bt;
})();
