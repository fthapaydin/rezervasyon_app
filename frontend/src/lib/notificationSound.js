// Programatik bildirim sesi üreteci (Web Audio API)
// Harici dosya indirme gerektirmez, doğrudan tarayıcı içinde kristal netliğinde üretilir.

let audioContext = null;

export function getAudioContext() {
  if (!audioContext) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      audioContext = new AudioCtx();
    }
  }
  return audioContext;
}

// Tarayıcı autoplay kısıtlamasını aşmak için ilk kullanıcı etkileşiminde sesi aç
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().then(() => {
        // Unlocked
      }).catch(() => {});
    }
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
  };
  window.addEventListener('click', unlockAudio, { passive: true });
  window.addEventListener('keydown', unlockAudio, { passive: true });
  window.addEventListener('touchstart', unlockAudio, { passive: true });
}

/**
 * Kliniğe yeni randevu talebi geldiğinde çalan
 * Dikkat çekici, yüksek sesli, melodik profesyonel klinik çağrı zili (3 tonlu Chime)
 */
export async function playNotificationSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    const now = ctx.currentTime;

    // 1. Ton: E5 (659.25 Hz) - Parlak başlangıç
    playChimeTone(ctx, 659.25, now, 0.45, 0.7);

    // 2. Ton: G#5 (830.61 Hz) - 120ms sonra yükselen ton
    playChimeTone(ctx, 830.61, now + 0.12, 0.45, 0.75);

    // 3. Ton: B5 (987.77 Hz) - 240ms sonra doruk tonu
    playChimeTone(ctx, 987.77, now + 0.24, 0.55, 0.85);

    // 4. Ton: E6 (1318.51 Hz) - 400ms sonra kristal yankı tonu
    playChimeTone(ctx, 1318.51, now + 0.40, 0.80, 0.9);

  } catch (err) {
    console.warn('Bildirim sesi çalma hatası:', err);
  }
}

function playChimeTone(ctx, freq, startTime, duration, volume = 0.5) {
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Çan/marimba tınısı için üçgen + sinüs karışımı hissi
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, startTime);

    // Zarif atak ve üstel sönümlenme (bell decay)
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  } catch (e) {
    // ignore
  }
}
