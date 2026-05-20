class AudioManager {
  constructor() {
    this.audioContext = null;
    this.bgVolume = 0.3;
    this.sfxVolume = 0.5;
    this.bgPlaying = false;
    this.bgOscillator = null;
    this.bgGainNode = null;
    
    this.initAudio();
  }

  initAudio() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn("Web Audio API not supported");
    }
  }

  playTone(frequency, duration, type = 'sine', volume = 0.3) {
    if (!this.audioContext) return;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(volume * this.sfxVolume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  playSuccess() {
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.2, 'sine', 0.2);
      }, i * 100);
    });
  }

  playUnlock() {
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.3, 'sine', 0.25);
      }, i * 80);
    });
  }

  playPlace() {
    this.playTone(800, 0.1, 'sine', 0.15);
  }

  playCombine() {
    this.playTone(600, 0.15, 'triangle', 0.2);
    setTimeout(() => this.playTone(800, 0.2, 'sine', 0.2), 100);
  }

  playError() {
    this.playTone(200, 0.3, 'sawtooth', 0.2);
  }

  startBackgroundMusic() {
    if (!this.audioContext || this.bgPlaying) return;
    
    this.bgPlaying = true;
    this.bgGainNode = this.audioContext.createGain();
    this.bgGainNode.connect(this.audioContext.destination);
    this.bgGainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    this.bgGainNode.gain.linearRampToValueAtTime(this.bgVolume, this.audioContext.currentTime + 1);
    
    const playNote = (freq, delay) => {
      if (!this.bgPlaying) return;
      
      const osc = this.audioContext.createOscillator();
      const noteGain = this.audioContext.createGain();
      
      osc.connect(noteGain);
      noteGain.connect(this.bgGainNode);
      
      osc.frequency.setValueAtTime(freq, this.audioContext.currentTime + delay);
      osc.type = 'sine';
      
      noteGain.gain.setValueAtTime(0, this.audioContext.currentTime + delay);
      noteGain.gain.linearRampToValueAtTime(0.15, this.audioContext.currentTime + delay + 0.1);
      noteGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + delay + 3);
      
      osc.start(this.audioContext.currentTime + delay);
      osc.stop(this.audioContext.currentTime + delay + 3);
    };
    
    const progression = [
      [440, 523.25, 659.25],
      [493.88, 587.33, 739.99],
      [523.25, 659.25, 783.99],
      [440, 523.25, 659.25],
    ];
    
    let bar = 0;
    const loop = () => {
      if (!this.bgPlaying) return;
      
      const chord = progression[bar % progression.length];
      chord.forEach((freq, i) => {
        playNote(freq, i * 0.2);
      });
      
      bar++;
      setTimeout(loop, 2000);
    };
    
    loop();
  }

  stopBackgroundMusic() {
    if (!this.bgGainNode) return;
    
    this.bgPlaying = false;
    this.bgGainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
    setTimeout(() => {
      this.bgGainNode = null;
    }, 500);
  }

  toggleBackgroundMusic() {
    if (this.bgPlaying) {
      this.stopBackgroundMusic();
    } else {
      this.startBackgroundMusic();
    }
    return !this.bgPlaying;
  }

  setBgVolume(value) {
    this.bgVolume = Math.max(0, Math.min(1, value));
    if (this.bgGainNode) {
      this.bgGainNode.gain.setValueAtTime(this.bgVolume, this.audioContext.currentTime);
    }
  }

  setSfxVolume(value) {
    this.sfxVolume = Math.max(0, Math.min(1, value));
  }

  get isBgPlaying() {
    return this.bgPlaying;
  }
}

export const audioManager = new AudioManager();