// Sound helpers. Browsers block audio until a user gesture, so every play()
// call is wrapped and failures ignored; unlock() is called on first input.
(function () {
  let unlocked = false;

  G.audio = {
    unlock() {
      if (unlocked) return;
      unlocked = true;
    },
    play(name, volume) {
      const base = G.sfx[name];
      if (!base) return;
      try {
        const a = base.cloneNode();
        a.volume = volume == null ? 0.7 : volume;
        a.play().catch(() => {});
      } catch (e) { /* ignore */ }
    },
    // Looping background music: reuses the single element.
    music(name, volume) {
      this.stopMusic();
      const a = G.sfx[name];
      if (!a) return;
      a.loop = true;
      a.volume = volume == null ? 0.35 : volume;
      a.currentTime = 0;
      a.play().catch(() => {});
      this._music = a;
    },
    stopMusic() {
      if (this._music) {
        this._music.pause();
        this._music = null;
      }
    }
  };
})();
