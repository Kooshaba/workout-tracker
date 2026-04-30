import restCompleteBellUrl from "../assets/audio/rest-complete-bell.wav";

type AudioSessionType =
  | "auto"
  | "playback"
  | "transient"
  | "transient-solo"
  | "ambient"
  | "play-and-record";

type NavigatorWithAudioSession = Navigator & {
  audioSession?: {
    type: AudioSessionType;
  };
};

type WindowWithWebkitAudioContext = Window & {
  webkitAudioContext?: typeof AudioContext;
};

let audioContext: AudioContext | null = null;
let restCompleteAudioElement: HTMLAudioElement | null = null;
let restCompleteSoundPromise: Promise<AudioBuffer | null> | null = null;

// Source: Wikimedia Commons, "Bicycle-bell-1.wav", CC0 1.0.
// https://commons.wikimedia.org/wiki/File:Bicycle-bell-1.wav
const REST_COMPLETE_VOLUME = 0.85;

function getAudioContext() {
  if (audioContext) return audioContext;

  const AudioContextClass =
    window.AudioContext ||
    (window as WindowWithWebkitAudioContext).webkitAudioContext;
  if (!AudioContextClass) return null;

  audioContext = new AudioContextClass();
  return audioContext;
}

function setTransientAudioSession() {
  const audioSession = (navigator as NavigatorWithAudioSession).audioSession;
  if (!audioSession) return;

  try {
    audioSession.type = "transient";
  } catch {
    // Unsupported browsers still get the regular Web Audio fallback.
  }
}

function loadRestCompleteSound(context: AudioContext) {
  if (restCompleteSoundPromise) return restCompleteSoundPromise;

  restCompleteSoundPromise = fetch(restCompleteBellUrl)
    .then((response) => {
      if (!response.ok) throw new Error("Unable to load rest timer sound");
      return response.arrayBuffer();
    })
    .then((arrayBuffer) => context.decodeAudioData(arrayBuffer))
    .catch(() => null);

  return restCompleteSoundPromise;
}

function getRestCompleteAudioElement() {
  if (restCompleteAudioElement) return restCompleteAudioElement;

  restCompleteAudioElement = new Audio(restCompleteBellUrl);
  restCompleteAudioElement.preload = "auto";
  restCompleteAudioElement.volume = REST_COMPLETE_VOLUME;
  return restCompleteAudioElement;
}

async function resumeAudioContext(context: AudioContext) {
  if (context.state !== "suspended") return true;

  try {
    await context.resume();
    return context.state !== "suspended";
  } catch {
    return false;
  }
}

function primeAudioContext(context: AudioContext) {
  try {
    const source = context.createBufferSource();
    const gain = context.createGain();

    source.buffer = context.createBuffer(1, 1, context.sampleRate);
    gain.gain.value = 0;
    source.connect(gain);
    gain.connect(context.destination);
    source.start();

    source.addEventListener("ended", () => {
      source.disconnect();
      gain.disconnect();
    });
  } catch {
    // The later playback fallbacks will handle browsers that reject priming.
  }
}

function playAudioBuffer(context: AudioContext, buffer: AudioBuffer) {
  try {
    const source = context.createBufferSource();
    const gain = context.createGain();

    source.buffer = buffer;
    gain.gain.value = REST_COMPLETE_VOLUME;
    source.connect(gain);
    gain.connect(context.destination);
    source.start();

    source.addEventListener("ended", () => {
      source.disconnect();
      gain.disconnect();
    });

    return true;
  } catch {
    return false;
  }
}

function playGeneratedFallback(context: AudioContext) {
  try {
    const now = context.currentTime;
    const frequencies = [880, 1174.66, 1567.98];

    frequencies.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const startAt = now + index * 0.12;
      const stopAt = startAt + 0.12;

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, startAt);
      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.exponentialRampToValueAtTime(0.18, startAt + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, stopAt);

      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(startAt);
      oscillator.stop(stopAt);

      oscillator.addEventListener("ended", () => {
        oscillator.disconnect();
        gain.disconnect();
      });
    });
  } catch {
    // At this point the browser is refusing audio playback entirely.
  }
}

function playHtmlAudioFallback() {
  try {
    const audio = getRestCompleteAudioElement();
    audio.currentTime = 0;
    audio.volume = REST_COMPLETE_VOLUME;
    return audio.play();
  } catch {
    return Promise.reject();
  }
}

export function unlockRestTimerAudio() {
  setTransientAudioSession();

  const context = getAudioContext();
  const audio = getRestCompleteAudioElement();
  audio.load();

  if (!context) {
    return;
  }

  void resumeAudioContext(context).then((canUseWebAudio) => {
    if (canUseWebAudio) {
      primeAudioContext(context);
    }
  });
  void loadRestCompleteSound(context);
}

export function playRestTimerDoneSound() {
  setTransientAudioSession();

  const context = getAudioContext();
  if (!context) {
    void playHtmlAudioFallback().catch(() => {});
    return;
  }

  void resumeAudioContext(context).then((canUseWebAudio) =>
    loadRestCompleteSound(context).then((buffer) => {
      if (canUseWebAudio && buffer && playAudioBuffer(context, buffer)) return;

      void playHtmlAudioFallback().catch(() => {
        if (canUseWebAudio) {
          playGeneratedFallback(context);
        }
      });
    })
  );
}
