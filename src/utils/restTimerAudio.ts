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
let restCompleteSoundPromise: Promise<AudioBuffer | null> | null = null;
let hasUnlockedAudio = false;

// Source: Wikimedia Commons, "Bicycle-bell-1.wav", CC0 1.0.
// https://commons.wikimedia.org/wiki/File:Bicycle-bell-1.wav
const REST_COMPLETE_VOLUME = 0.45;

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

export function unlockRestTimerAudio() {
  setTransientAudioSession();

  const context = getAudioContext();
  if (!context) return;

  if (context.state === "suspended") {
    void context.resume();
  }

  void loadRestCompleteSound(context);
  hasUnlockedAudio = true;
}

export function playRestTimerDoneSound() {
  setTransientAudioSession();

  const context = getAudioContext();
  if (!context || !hasUnlockedAudio) return;

  if (context.state === "suspended") {
    void context.resume();
  }

  void loadRestCompleteSound(context).then((buffer) => {
    if (!buffer) return;

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
  });
}
