// Dialogue box in the style of the original Flash dialogueBox: slides up from
// the bottom, typewriter text, advance with E / Space / Enter / click.
// Scripts are taken verbatim from the original design documents.
(function () {
  const BOX_H = 160; // 24:5-ish ratio from the design doc

  G.SCRIPTS = {
    GAME_START: [
      { s: 'Cody', t: 'What a horrible day...' },
      { s: 'Cody', t: 'Is there anything better than school? Anything at all?' }
    ],
    PHONE_INVITE: [
      { s: 'Phone', t: '(RING RING) New message!' },
      { s: 'Phone', t: '"Heyyy Cody! It\'s Ecster! You\'re invited to my birthday party at my house today. Don\'t be late! <3"' },
      { s: 'Cody', t: 'Woah... an invitation? Me?! I... I actually have friends?!' },
      { s: 'Cody', t: 'Ecster\'s house is the blue one across the road. Better head over! (Arrow keys to move, E to interact)' }
    ],
    GLUE_SPOT: [
      { s: 'Cody', t: '!!! Woah, it\'s those three popular guys Dash, Antonio and Axel! Hmm... what are they doing?' }
    ],
    GLUE_SNIFF_START: [
      { s: 'Dash', t: 'Hey Codes, whataya doing here?' },
      { s: 'Cody', t: 'Nothing much, just making my way home from a boring day of school.' },
      { s: 'Antonio', t: 'Boring? Wanna know how to make it better? Check out this scent bro... (holds up can) Y\'know what this smell is? (sniffs)' },
      { s: 'Cody', t: 'What?' },
      { s: 'Axel', t: 'It\'s the smell of HAPPINESS! Wanna try?' },
      { s: 'Cody', t: '!!! That\'s heavy duty glue!' },
      { s: 'Dash', t: 'TRY IT. DON\'T BE A SISSY. COME ON DUDE, MAN UP.' },
      { s: 'Cody', t: 'But it\'s... they\'re... they\'re drugs!!! Aren\'t we supposed to say NO to them?' },
      { s: 'Dash', t: 'Go be a sissy then. Sissy.' },
      { s: 'Cody', t: 'Life\'s gonna be such a torment! I\'ll be called a sissy... ignored in school... or even beaten up! AH! WHAT SHOULD I DO?!' }
    ],
    GLUE_WIN: [
      { s: 'Cody', t: 'NO. Life Does Not Rewind, my friends. You gotta stop!' },
      { s: 'Dash', t: 'Whatever, sissy. Let\'s bounce, guys.' },
      { s: 'Cody', t: 'Phew... I said NO. And you know what? It feels GREAT.' }
    ],
    GLUE_LOSE: [
      { s: 'Cody', t: '(sniff)... AHHH! Why does my head hurt so much?!' },
      { s: 'Cody', t: 'What is this feeling! That headache... it\'s killing me! I can\'t even walk straight...' },
      { s: 'Cody', t: 'I should NEVER have done that. Life does not rewind...' }
    ],
    PARTY_START: [
      { s: 'Ecster', t: 'Oh Cody you are finally hereeeeeee... we were waiting for youuuu... to join the after party!' },
      { s: 'Cody', t: 'Woah Ecster, are you okay?' },
      { s: 'Ecster', t: 'DUHHH... come have some Mentos and get ECSTATIC like meeeee! Woohoo!' },
      { s: 'Cody', t: 'Ecster! Those coloured pills don\'t look like Mentos...' },
      { s: 'Cody', t: '(remembers seeing them on the field trip to CNB) ... ECSTER, THOSE ARE ECSTASY PILLS!' },
      { s: 'Ecster', t: 'Yea whatever. Take it or leave my party, loser!' }
    ],
    PARTY_WIN: [
      { s: 'Cody', t: 'No. I\'m leaving. A real friend wouldn\'t call me a loser for saying NO.' },
      { s: 'Cody', t: 'I hope Ecster gets help... Drugs aren\'t a party. Life does not rewind.' }
    ],
    PARTY_LOSE: [
      { s: 'Cody', t: '(swallows pill) ...Woah... the room... it\'s all... spinning and glowing...' },
      { s: 'Cody', t: 'My heart is racing way too fast... this was a HUGE mistake...' },
      { s: 'Cody', t: 'Life does not rewind. I wish I could take it back...' }
    ],
    ENDING_GOOD: [
      { s: 'Cody', t: 'What a day. Everyone kept pushing drugs at me... and I said NO every single time.' },
      { s: 'Cody', t: 'I don\'t need glue or pills to be happy. And anyone who calls me a sissy for that isn\'t a friend.' },
      { s: 'Cody', t: 'Remember: LIFE DOES NOT REWIND. Say NO to drugs!' }
    ],
    ENDING_BAD: [
      { s: 'Cody', t: 'My head is pounding... my heart won\'t slow down... why did I give in?' },
      { s: 'Cody', t: 'The damage is done. I can\'t undo it. LIFE DOES NOT REWIND.' },
      { s: 'Cody', t: 'Learn from my mistake. SAY NO TO DRUGS. The first time. Every time.' }
    ]
  };

  // Signboard facts, from "Drug info for the signboards.docx"
  G.BOARDS = {
    glue: {
      img: 'board_glue',
      title: 'HEAVY DUTY GLUE SNIFFING',
      text: 'Most inhalants act directly on the nervous system to produce mind-altering effects. Within seconds the user experiences intoxication: inability to coordinate movement, hallucinations and delusions, severe headaches, rashes around the nose and mouth. Prolonged sniffing can induce irregular and rapid heartbeat and lead to heart failure and death within minutes. Death from suffocation can also occur.'
    },
    ecstasy: {
      img: 'board_ecstasy',
      title: 'ECSTASY',
      text: 'Ecstasy is a powerful stimulant and mood changer that speeds up your body system and alters your perception of the world. It disturbs the body\'s ability to regulate its temperature, which can lead to serious problems such as heat shock. Experts suspect a link between brain damage and long term ecstasy use.'
    },
    heroin: {
      img: 'board_heroin',
      title: 'HEROIN',
      text: 'Heroin suppresses the central nervous system: users experience "cloudy" mental function and can breathe at a slower rate until respiratory failure. Long-term effects: heart complications, liver disease, kidney disease, skin infections. The most serious effect is death from accidental overdose.'
    }
  };

  const PORTRAITS = { Cody: 'profile_cody', Dash: 'profile_dash', Antonio: 'profile_antonio', Axel: 'profile_axel', Phone: 'profile_phone', Ecster: 'ecster1' };

  G.dialogue = {
    active: false,
    lines: [],
    at: 0,
    chars: 0,
    slide: 0, // 0 hidden -> 1 shown
    onDone: null,

    start(lines, onDone) {
      this.lines = lines;
      this.at = 0;
      this.chars = 0;
      this.slide = 0;
      this.active = true;
      this.onDone = onDone || null;
    },

    advance() {
      if (!this.active) return;
      const line = this.lines[this.at];
      if (this.chars < line.t.length) {
        this.chars = line.t.length; // finish typewriter first
        return;
      }
      G.audio.play('click', 0.4);
      this.at++;
      this.chars = 0;
      if (this.at >= this.lines.length) {
        this.active = false;
        const cb = this.onDone;
        this.onDone = null;
        if (cb) cb();
      }
    },

    update(dt) {
      if (this.active && this.slide < 1) this.slide = Math.min(1, this.slide + dt * 4);
      if (!this.active && this.slide > 0) this.slide = Math.max(0, this.slide - dt * 4);
      if (this.active) {
        const line = this.lines[this.at];
        if (this.chars < line.t.length) this.chars += dt * 60;
      }
    },

    draw(ctx) {
      if (this.slide <= 0) return;
      const W = 1024, H = 768;
      const y = H - BOX_H * this.slide;
      ctx.save();
      // box
      ctx.fillStyle = 'rgb(16, 20, 32)';
      ctx.fillRect(16, y, W - 32, BOX_H - 12);
      ctx.strokeStyle = '#9fe8e0';
      ctx.lineWidth = 3;
      ctx.strokeRect(16, y, W - 32, BOX_H - 12);

      if (!this.active && this.slide < 1) { ctx.restore(); return; }
      const line = this.lines[Math.min(this.at, this.lines.length - 1)];

      // portrait
      const pImg = G.img[PORTRAITS[line.s]];
      if (pImg && pImg.width) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(pImg, 36, y + 26, 80, 80);
        ctx.strokeStyle = '#9fe8e0';
        ctx.lineWidth = 2;
        ctx.strokeRect(36, y + 26, 80, 80);
      }

      // speaker name
      ctx.fillStyle = '#ffd257';
      ctx.font = '30px Wendy, monospace';
      ctx.fillText(line.s.toUpperCase(), 140, y + 40);

      // text (wrapped, typewriter)
      ctx.fillStyle = '#ffffff';
      ctx.font = '26px Wendy, monospace';
      const shown = line.t.slice(0, Math.floor(this.chars));
      wrapText(ctx, shown, 140, y + 72, W - 200, 28);

      // prompt
      if (this.chars >= line.t.length) {
        ctx.fillStyle = '#9fe8e0';
        ctx.font = '22px Wendy, monospace';
        const blink = Math.floor(performance.now() / 400) % 2 === 0;
        if (blink) ctx.fillText('E / SPACE >', W - 150, y + BOX_H - 32);
      }
      ctx.restore();
    }
  };

  G.wrapText = wrapText;
  function wrapText(ctx, text, x, y, maxW, lineH) {
    const words = text.split(' ');
    let line = '';
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line, x, y);
        line = w;
        y += lineH;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, x, y);
    return y;
  }
})();
