// Generates small placeholder .wav files for all sounds referenced in src/lib/audio.ts.
// Real game audio should replace these (see public/sounds/README.md).
// Run: node scripts/generate-sounds.cjs
const fs = require("fs");
const path = require("path");

const DIR = path.join(__dirname, "..", "public", "sounds");
fs.mkdirSync(DIR, { recursive: true });

const SR = 22050;

const writeWav = (name, samples) => {
  const n = samples.length;
  const buf = Buffer.alloc(44 + n * 2);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + n * 2, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    const v = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE(Math.round(v * 32767), 44 + i * 2);
  }
  fs.writeFileSync(path.join(DIR, name), buf);
  console.log("wrote", name, (buf.length / 1024).toFixed(1) + "KB");
};

const secs = (s) => Math.floor(SR * s);
const sine = (f, t) => Math.sin(2 * Math.PI * f * t);
const noise = () => Math.random() * 2 - 1;
// Seamless loop helper: crossfade last fadeN samples with the start.
const loopify = (arr, fadeN = SR / 10) => {
  for (let i = 0; i < fadeN; i++) {
    const k = i / fadeN;
    arr[arr.length - fadeN + i] = arr[arr.length - fadeN + i] * k + arr[i] * (1 - k);
  }
  return arr;
};

const engine = (baseF, durS) => {
  const arr = new Array(secs(durS));
  for (let i = 0; i < arr.length; i++) {
    const t = i / SR;
    arr[i] =
      0.35 * sine(baseF, t) +
      0.2 * sine(baseF * 2, t) +
      0.1 * sine(baseF * 0.5, t) +
      0.05 * noise();
  }
  return loopify(arr);
};

const blip = (freqs, durS, vol = 0.5) => {
  const arr = new Array(secs(durS)).fill(0);
  const per = Math.floor(arr.length / freqs.length);
  freqs.forEach((f, idx) => {
    for (let i = 0; i < per && idx * per + i < arr.length; i++) {
      const t = i / SR;
      const env = Math.exp(-3 * (i / per));
      arr[idx * per + i] += vol * sine(f, t) * env;
    }
  });
  return arr;
};

const noiseBurst = (durS, vol = 0.4, decay = 4) => {
  const arr = new Array(secs(durS));
  let last = 0;
  for (let i = 0; i < arr.length; i++) {
    const t = i / arr.length;
    last = last * 0.7 + noise() * 0.3; // lowpass-ish
    arr[i] = last * vol * Math.exp(-decay * t);
  }
  return arr;
};

writeWav("engine-idle.wav", engine(55, 1.5));
writeWav("engine-rev.wav", engine(110, 1.5));
writeWav("engine-mid.wav", engine(165, 1.5));
writeWav("engine-high.wav", engine(220, 1.5));
writeWav("tire-screech.wav", loopify(noiseBurst(1.2, 0.3, 0.5)));
writeWav("crash.wav", noiseBurst(0.6, 0.6, 6));
writeWav("nitro.wav", loopify(noiseBurst(1.5, 0.35, 1)));
writeWav("countdown-beep.wav", blip([880], 0.25));
writeWav("race-start.wav", blip([523, 659, 784], 0.9));
writeWav("victory.wav", blip([523, 659, 784, 1047], 1.6));
writeWav("defeat.wav", blip([392, 330, 262], 1.2));
writeWav(
  "ambient-music-1.wav",
  loopify(
    (() => {
      const arr = new Array(secs(4));
      for (let i = 0; i < arr.length; i++) {
        const t = i / SR;
        arr[i] = 0.15 * sine(130.8, t) + 0.12 * sine(164.8, t) + 0.1 * sine(196, t);
      }
      return arr;
    })()
  )
);
writeWav(
  "ambient-music-2.wav",
  loopify(
    (() => {
      const arr = new Array(secs(4));
      for (let i = 0; i < arr.length; i++) {
        const t = i / SR;
        arr[i] = 0.15 * sine(146.8, t) + 0.12 * sine(174.6, t) + 0.1 * sine(220, t);
      }
      return arr;
    })()
  )
);
writeWav("wind.wav", loopify(noiseBurst(2, 0.15, 0.2)));
console.log("done");
