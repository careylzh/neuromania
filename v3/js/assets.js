// Asset loader. All images land in G.img[key], sounds in G.sfx[key].
window.G = {
  img: {},
  sfx: {},
  save: {
    glueDone: false, glueWon: null,
    partyDone: false, partyWon: null,
    handicap: 0,          // grows with each battle lost; makes future battles harder
    signsRead: {},
    difficulty: 'normal'  // easy | normal | hard
  }
};

(function () {
  const DIRS = ['up', 'down', 'left', 'right', 'upleft', 'upright', 'downleft', 'downright'];
  const manifest = {};

  DIRS.forEach(d => {
    for (let i = 1; i <= 6; i++) manifest[`cody_walk_${d}_${i}`] = `assets/cody/walk/${d}/${i}.png`;
    for (let i = 1; i <= 2; i++) manifest[`cody_idle_${d}_${i}`] = `assets/cody/idle/${d}/${i}.png`;
  });

  Object.assign(manifest, {
    map_main: 'assets/map/main.jpg',
    map_float: 'assets/map/main_float.png',
    good1: 'assets/mindplay/good1.png',
    good2: 'assets/mindplay/good2.png',
    good3: 'assets/mindplay/good3.png',
    bad1: 'assets/mindplay/bad1.png',
    bad2: 'assets/mindplay/bad2.png',
    link_baby: 'assets/mindplay/link_baby.png',
    link_mama: 'assets/mindplay/link_mama.png',
    trio1: 'assets/trio/idle1.png',
    trio2: 'assets/trio/idle2.png',
    trio_alerted: 'assets/trio/alerted.png',
    ecster1: 'assets/trio/ecster1.png',
    ecster2: 'assets/trio/ecster2.png',
    logo: 'assets/ui/logo.png',
    icon: 'assets/ui/icon.png',
    excl: 'assets/bubbles/exclamation.png',
    talk1: 'assets/bubbles/talk1.png',
    talk2: 'assets/bubbles/talk2.png',
    talk3: 'assets/bubbles/talk3.png',
    profile_antonio: 'assets/ui/profile_antonio.png',
    profile_axel: 'assets/ui/profile_axel.png',
    profile_cody: 'assets/ui/profile_cody.png',
    profile_dash: 'assets/ui/profile_dash.png',
    profile_phone: 'assets/ui/profile_phone.png',
    board_glue: 'assets/boards/glue.png',
    board_ecstasy: 'assets/boards/ecstasy.png',
    board_heroin: 'assets/boards/heroin.png'
  });
  for (let i = 1; i <= 6; i++) manifest[`load${i}`] = `assets/ui/load${i}.png`;

  const sounds = {
    button: 'assets/sfx/button.mp3',
    button2: 'assets/sfx/button2.mp3',
    break: 'assets/sfx/break.mp3',
    alarm: 'assets/sfx/alarm.mp3',
    phone: 'assets/sfx/phone.mp3',
    win: 'assets/sfx/win.mp3',
    lose: 'assets/sfx/lose.mp3',
    star: 'assets/sfx/star.mp3',
    click: 'assets/sfx/click.mp3',
    music: 'assets/sfx/music.mp3'
  };

  G.loadAll = function (onProgress) {
    const keys = Object.keys(manifest);
    let done = 0;
    const total = keys.length;
    const promises = keys.map(k => new Promise(resolve => {
      const im = new Image();
      im.onload = im.onerror = () => { done++; onProgress && onProgress(done / total); resolve(); };
      im.src = manifest[k];
      G.img[k] = im;
    }));
    // Sounds load lazily; just create the elements.
    for (const [k, src] of Object.entries(sounds)) {
      const a = new Audio(src);
      a.preload = 'auto';
      G.sfx[k] = a;
    }
    return Promise.all(promises);
  };
})();
