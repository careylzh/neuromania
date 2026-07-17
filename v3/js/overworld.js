// Overworld: Cody explores the neighbourhood map (MAIN MAP/Map.jpg, drawn at
// 2x). Quests: the cool trio at the carpark (glue battle) and Ecster's house
// (ecstasy battle). Signboards teach real drug facts, as in the original.
(function () {
  const W = 1024, H = 768;
  const SCALE = 2;
  const MAPW = 1024 * SCALE, MAPH = 836 * SCALE;
  const SPEED = 300; // px/s in world space

  // Blocked rectangles in native map coordinates (×2 at runtime).
  const BLOCKS = [
    [0, 0, 512, 172],      // left HDB block
    [512, 0, 512, 103],    // right HDB block
    [592, 98, 122, 74],    // beige car
    [742, 92, 138, 85],    // red car
    [903, 168, 121, 84],   // blue van
    [898, 250, 126, 72],   // black car
    [405, 165, 168, 26],   // guard rail 1
    [405, 262, 168, 30],   // guard rail 2
    [0, 302, 560, 42],     // bush row
    [0, 570, 322, 266],    // Ecster's house
    [368, 672, 36, 50],    // bench by the court
    [440, 598, 610, 26]    // court fence line / hoop poles
  ];

  const SIGNS = [
    { id: 'glue', x: 378, y: 296, r: 55 },
    { id: 'ecstasy', x: 383, y: 762, r: 55 },
    { id: 'heroin', x: 901, y: 598, r: 55 }
  ];

  const TRIO = { x: 800, y: 230 };        // carpark hangout spot
  const DOOR = { x: 340, y: 700 };        // Ecster's house entrance marker

  const ow = {
    px: 470 * SCALE, py: 470 * SCALE,     // player world pos (feet)
    dir: 'down', moving: false, animT: 0,
    camX: 0, camY: 0,
    introDone: false,
    trioSpotted: false,
    boardOpen: null,
    hint: '', hintT: 0,
    // post-battle status effects
    invertT: 0, hazeT: 0, hallucT: 0,
    fade: 0, fadeDir: 0, afterFade: null,
    endingQueued: false,

    enter() {
      G.audio.stopMusic();
      if (!this.introDone) {
        this.introDone = true;
        const self = this;
        G.dialogue.start(G.SCRIPTS.GAME_START, () => {
          G.audio.play('phone', 0.6);
          setTimeout(() => G.dialogue.start(G.SCRIPTS.PHONE_INVITE), 900);
        });
      }
    },

    // called by battle scene when a MindPlay battle resolves
    battleFinished(kind, won) {
      G.setScene(this);
      const self = this;
      if (kind === 'glue') {
        G.save.glueDone = true; G.save.glueWon = won;
        if (!won) { G.save.handicap++; this.invertT = 15; this.hazeT = 15; }
        G.dialogue.start(won ? G.SCRIPTS.GLUE_WIN : G.SCRIPTS.GLUE_LOSE, () => self.maybeEnd());
      } else {
        G.save.partyDone = true; G.save.partyWon = won;
        if (!won) { G.save.handicap++; this.hallucT = 15; }
        G.dialogue.start(won ? G.SCRIPTS.PARTY_WIN : G.SCRIPTS.PARTY_LOSE, () => self.maybeEnd());
      }
    },

    maybeEnd() {
      if (G.save.glueDone && G.save.partyDone && !this.endingQueued) {
        this.endingQueued = true;
        const self = this;
        setTimeout(() => {
          const good = G.save.glueWon && G.save.partyWon;
          G.dialogue.start(good ? G.SCRIPTS.ENDING_GOOD : G.SCRIPTS.ENDING_BAD, () => {
            G.endingScene.won = good;
            G.setScene(G.endingScene);
          });
        }, 600);
      }
    },

    blockedAt(x, y) {
      // feet hitbox in world coords
      const hw = 12 * SCALE / 2 + 6, hh = 8;
      for (const b of BLOCKS) {
        const bx = b[0] * SCALE, by = b[1] * SCALE, bw = b[2] * SCALE, bh = b[3] * SCALE;
        if (x + hw > bx && x - hw < bx + bw && y > by && y - hh * 2 < by + bh) return true;
      }
      // trio blocks movement too
      const tx = TRIO.x * SCALE, ty = TRIO.y * SCALE;
      if (Math.abs(x - tx) < 50 && Math.abs(y - ty) < 40) return true;
      return false;
    },

    keyDown(code) {
      if (G.dialogue.active && (code === 'KeyE' || code === 'Space' || code === 'Enter')) {
        G.dialogue.advance();
        return;
      }
      if (this.boardOpen) {
        if (code === 'KeyE' || code === 'Escape' || code === 'Space') {
          this.boardOpen = null;
          G.audio.play('button');
        }
        return;
      }
      if (code === 'KeyE') this.tryInteract();
      if (code === 'Escape') G.setScene(G.menuScene);
    },

    click() { if (G.dialogue.active) G.dialogue.advance(); },

    tryInteract() {
      const mx = this.px / SCALE, my = this.py / SCALE;
      for (const s of SIGNS) {
        if (Math.hypot(mx - s.x, my - s.y) < s.r) {
          this.boardOpen = s.id;
          G.save.signsRead[s.id] = true;
          G.audio.play('button');
          return;
        }
      }
      if (Math.hypot(mx - DOOR.x, my - DOOR.y) < 60) {
        if (!G.save.partyDone) {
          this.startParty();
        } else {
          this.setHint(G.save.glueDone ? 'The party is over...' : 'I should check out that commotion at the carpark first.');
        }
        return;
      }
      if (!G.save.glueDone && Math.hypot(mx - TRIO.x, my - TRIO.y) < 90) {
        this.startGlue();
        return;
      }
      this.setHint('Nothing to do here. (E near signs, people and doors)');
    },

    startGlue() {
      const self = this;
      G.dialogue.start(G.SCRIPTS.GLUE_SNIFF_START, () => {
        G.audio.play('alarm', 0.5);
        self.fadeTo(() => G.battleScene.begin('glue'));
      });
    },

    startParty() {
      const self = this;
      G.dialogue.start(G.SCRIPTS.PARTY_START, () => {
        G.audio.play('alarm', 0.5);
        self.fadeTo(() => G.battleScene.begin('ecstasy'));
      });
    },

    fadeTo(fn) {
      this.fadeDir = 1;
      this.afterFade = fn;
    },

    setHint(t) { this.hint = t; this.hintT = 3; },

    update(dt) {
      G.dialogue.update(dt);
      if (this.hintT > 0) this.hintT -= dt;
      if (this.invertT > 0) this.invertT -= dt;
      if (this.hazeT > 0) this.hazeT -= dt;
      if (this.hallucT > 0) this.hallucT -= dt;

      if (this.fadeDir === 1) {
        this.fade = Math.min(1, this.fade + dt * 2);
        if (this.fade >= 1) {
          this.fadeDir = 0;
          const fn = this.afterFade; this.afterFade = null;
          this.fade = 0;
          if (fn) fn();
        }
        return;
      }

      const busy = G.dialogue.active || this.boardOpen;
      let dx = 0, dy = 0;
      if (!busy) {
        if (G.held('ArrowLeft')) dx -= 1;
        if (G.held('ArrowRight')) dx += 1;
        if (G.held('ArrowUp')) dy -= 1;
        if (G.held('ArrowDown')) dy += 1;
        if (this.invertT > 0) { dx = -dx; dy = -dy; } // glue: walk in opposite directions
      }

      this.moving = dx !== 0 || dy !== 0;
      if (this.moving) {
        if (dy < 0) this.dir = dx < 0 ? 'upleft' : dx > 0 ? 'upright' : 'up';
        else if (dy > 0) this.dir = dx < 0 ? 'downleft' : dx > 0 ? 'downright' : 'down';
        else this.dir = dx < 0 ? 'left' : 'right';

        const len = Math.hypot(dx, dy);
        const nx = this.px + (dx / len) * SPEED * dt;
        const ny = this.py + (dy / len) * SPEED * dt;
        if (!this.blockedAt(nx, this.py)) this.px = Math.max(20, Math.min(MAPW - 20, nx));
        if (!this.blockedAt(this.px, ny)) this.py = Math.max(40, Math.min(MAPH - 6, ny));
        this.animT += dt;
      } else {
        this.animT += dt * 0.4;
      }

      // trio "spotted" cutscene beat
      if (!G.save.glueDone && !this.trioSpotted && !busy) {
        const d = Math.hypot(this.px / SCALE - TRIO.x, this.py / SCALE - TRIO.y);
        if (d < 180) {
          this.trioSpotted = true;
          G.audio.play('star', 0.5);
          G.dialogue.start(G.SCRIPTS.GLUE_SPOT);
        }
      }

      // camera
      this.camX = Math.max(0, Math.min(MAPW - W, this.px - W / 2));
      this.camY = Math.max(0, Math.min(MAPH - H, this.py - H / 2));
    },

    drawSprite(ctx, img, wx, wy, scale) {
      if (!img || !img.width) return;
      const w = img.width * scale, h = img.height * scale;
      ctx.drawImage(img, Math.round(wx - this.camX - w / 2), Math.round(wy - this.camY - h), w, h);
    },

    draw(ctx) {
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      if (this.hallucT > 0) {
        const hue = Math.sin(performance.now() / 300) * 90;
        ctx.filter = `hue-rotate(${hue}deg) saturate(1.6)`;
      }

      // map
      ctx.drawImage(G.img.map_main, -this.camX, -this.camY, MAPW, MAPH);

      // signboard markers (small pulsing arrows)
      for (const s of SIGNS) {
        const sy = s.y * SCALE - this.camY - 40 + Math.sin(performance.now() / 250) * 4;
        ctx.fillStyle = '#ffd257';
        ctx.font = '28px Wendy, monospace';
        ctx.fillText('?', s.x * SCALE - this.camX - 6, sy);
      }

      // door marker
      if (!G.save.partyDone) {
        const dy = DOOR.y * SCALE - this.camY - 46 + Math.sin(performance.now() / 250) * 5;
        ctx.fillStyle = '#7cf78c';
        ctx.beginPath();
        const dxp = DOOR.x * SCALE - this.camX;
        ctx.moveTo(dxp - 10, dy); ctx.lineTo(dxp + 10, dy); ctx.lineTo(dxp, dy + 14);
        ctx.closePath(); ctx.fill();
      }

      // trio NPC
      if (!G.save.glueDone) {
        const near = Math.hypot(this.px / SCALE - TRIO.x, this.py / SCALE - TRIO.y) < 150;
        const frame = near ? G.img.trio_alerted
          : (Math.floor(performance.now() / 500) % 2 ? G.img.trio2 : G.img.trio1);
        this.drawSprite(ctx, frame, TRIO.x * SCALE, TRIO.y * SCALE + 32, SCALE * 1.4);
        if (near) {
          const ey = TRIO.y * SCALE - this.camY - 60 + Math.sin(performance.now() / 200) * 3;
          const ex = TRIO.x * SCALE - this.camX;
          const im = G.img.excl;
          ctx.drawImage(im, ex - 9, ey - 24, 18, 24);
        }
      }

      // player (draw before floating layer so trees/cars overlap him)
      const set = this.moving ? 'walk' : 'idle';
      const count = this.moving ? 6 : 2;
      const fps = this.moving ? 10 : 3;
      const fr = 1 + (Math.floor(this.animT * fps) % count);
      const sprite = G.img[`cody_${set}_${this.dir}_${fr}`] || G.img[`cody_idle_${this.dir}_1`];
      this.drawSprite(ctx, sprite, this.px, this.py, SCALE);

      // floating layer (over player)
      ctx.drawImage(G.img.map_float, -this.camX, -this.camY, MAPW, MAPH);
      ctx.filter = 'none';

      // glue haze
      if (this.hazeT > 0) {
        ctx.fillStyle = `rgba(120, 70, 20, ${0.25 * Math.min(1, this.hazeT / 3)})`;
        ctx.fillRect(0, 0, W, H);
      }

      // quest tracker
      ctx.font = '24px Wendy, monospace';
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(8, 8, 420, G.save.glueDone && G.save.partyDone ? 40 : 68);
      ctx.fillStyle = '#ffd257';
      ctx.fillText('TODO:', 20, 34);
      ctx.fillStyle = '#fff';
      let ty = 34;
      if (!G.save.partyDone) { ty += 26; ctx.fillText('- Get to Ecster\'s party (blue house)', 20, ty); }
      if (!G.save.glueDone) { ty += 26; ctx.fillText('- Something\'s up at the carpark...', 20, ty); }
      if (G.save.glueDone && G.save.partyDone) ctx.fillText('Head home... it\'s been a day.', 80, 34);

      // status effect labels
      if (this.invertT > 0) {
        ctx.fillStyle = '#ff8a8a';
        ctx.fillText('HEADACHE! Controls reversed! (' + Math.ceil(this.invertT) + 's)', 20, H - 20);
      } else if (this.hallucT > 0) {
        ctx.fillStyle = '#ff8aff';
        ctx.fillText('HALLUCINATING... (' + Math.ceil(this.hallucT) + 's)', 20, H - 20);
      }

      // hint
      if (this.hintT > 0 && !G.dialogue.active) {
        ctx.font = '26px Wendy, monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#9fe8e0';
        ctx.fillText(this.hint, W / 2, H - 40);
        ctx.textAlign = 'left';
      }

      // interact prompt
      if (!G.dialogue.active && !this.boardOpen && this.hintT <= 0) {
        const mx = this.px / SCALE, my = this.py / SCALE;
        let prompt = null;
        for (const s of SIGNS) if (Math.hypot(mx - s.x, my - s.y) < s.r) prompt = 'E - READ SIGNBOARD';
        if (Math.hypot(mx - DOOR.x, my - DOOR.y) < 60) prompt = 'E - KNOCK';
        if (!G.save.glueDone && Math.hypot(mx - TRIO.x, my - TRIO.y) < 90) prompt = 'E - TALK';
        if (prompt) {
          ctx.font = '28px Wendy, monospace';
          ctx.textAlign = 'center';
          ctx.fillStyle = '#ffd257';
          ctx.fillText(prompt, W / 2, H - 40);
          ctx.textAlign = 'left';
        }
      }

      // signboard overlay
      if (this.boardOpen) {
        const b = G.BOARDS[this.boardOpen];
        ctx.fillStyle = 'rgba(8, 6, 4, 0.85)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#f4ecd8';
        ctx.fillRect(142, 110, W - 284, H - 240);
        ctx.strokeStyle = '#b98a2c';
        ctx.lineWidth = 6;
        ctx.strokeRect(142, 110, W - 284, H - 240);
        const im = G.img[b.img];
        if (im.width) ctx.drawImage(im, W / 2 - 100, 130, 200, 164);
        ctx.fillStyle = '#7a1f1f';
        ctx.font = '38px Wendy, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(b.title, W / 2, 340);
        ctx.textAlign = 'left';
        ctx.fillStyle = '#2c2416';
        ctx.font = '24px Wendy, monospace';
        G.wrapText(ctx, b.text, 180, 380, W - 360, 28);
        ctx.fillStyle = '#7a5a1f';
        ctx.textAlign = 'center';
        ctx.fillText('E - CLOSE', W / 2, H - 150);
        ctx.textAlign = 'left';
      }

      G.dialogue.draw(ctx);

      if (this.fadeDir === 1 || this.fade > 0) {
        ctx.fillStyle = `rgba(0,0,0,${this.fade})`;
        ctx.fillRect(0, 0, W, H);
      }
      ctx.restore();
    }
  };

  G.overworldScene = ow;

  // Simple ending card.
  G.endingScene = {
    won: false,
    t: 0,
    enter() { this.t = 0; G.audio.play(this.won ? 'win' : 'lose', 0.7); },
    update(dt) { this.t += dt; },
    keyDown(code) {
      if (this.t > 2 && (code === 'Enter' || code === 'Space' || code === 'KeyE')) {
        // reset run
        G.save.glueDone = G.save.partyDone = false;
        G.save.glueWon = G.save.partyWon = null;
        G.save.handicap = 0;
        ow.introDone = true; ow.trioSpotted = false; ow.endingQueued = false;
        ow.px = 470 * SCALE; ow.py = 470 * SCALE;
        ow.invertT = ow.hazeT = ow.hallucT = 0;
        G.setScene(G.menuScene);
      }
    },
    click() { this.keyDown('Enter'); },
    draw(ctx) {
      ctx.fillStyle = this.won ? '#0c2410' : '#240c0c';
      ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center';
      const logo = G.img.logo;
      if (logo.width) ctx.drawImage(logo, (W - logo.width * 8) / 2, 100, logo.width * 8, logo.height * 8);
      ctx.font = '54px Wendy, monospace';
      ctx.fillStyle = this.won ? '#7cf78c' : '#ff8a8a';
      ctx.fillText(this.won ? 'CODY SAID NO TO DRUGS!' : 'CODY GAVE IN...', W / 2, 420);
      ctx.font = '32px Wendy, monospace';
      ctx.fillStyle = '#fff';
      ctx.fillText(this.won
        ? 'Strong thoughts. Strong mind. Strong friend.'
        : 'The damage cannot be undone.', W / 2, 480);
      ctx.fillStyle = '#ffd257';
      ctx.font = '40px Wendy, monospace';
      ctx.fillText('LIFE DOES NOT REWIND.', W / 2, 560);
      if (this.t > 2) {
        ctx.font = '26px Wendy, monospace';
        ctx.fillStyle = '#9fe8e0';
        if (Math.floor(performance.now() / 400) % 2 === 0) ctx.fillText('PRESS ENTER FOR MAIN MENU', W / 2, 660);
      }
      ctx.textAlign = 'left';
    }
  };
})();
