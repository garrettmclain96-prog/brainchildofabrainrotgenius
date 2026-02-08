import { useRef, useCallback, useEffect, useState } from 'react';
import { useAppMode } from '@/hooks/useAppMode';

/**
 * Ethereal Ambient Audio Engine
 * 
 * Generates a living soundscape of procedural drones, breathing pads,
 * and soft harmonic textures. Shifts with decay level, user activity,
 * and mode (Prune vs Rot).
 * 
 * Moves away from tape-hiss and mechanical textures toward
 * luminous, airy, and contemplative sound design.
 * 
 * Silence is allowed and respected.
 */

interface AmbientState {
  isPlaying: boolean;
  volume: number;
}

// Soft pink noise for ethereal texture (warmer than brown noise)
function createEtherealNoiseBuffer(ctx: AudioContext, duration: number): AudioBuffer {
  const buffer = ctx.createBuffer(2, ctx.sampleRate * duration, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.05;
      b6 = white * 0.115926;
    }
  }
  return buffer;
}

export function useAmbientAudio() {
  const { mode } = useAppMode();
  const ctxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const nodesRef = useRef<AudioNode[]>([]);
  const intervalsRef = useRef<ReturnType<typeof setInterval>[]>([]);
  const [state, setState] = useState<AmbientState>({ isPlaying: false, volume: 0.5 });
  const decayRef = useRef(0);

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
      masterGainRef.current = ctxRef.current.createGain();
      masterGainRef.current.gain.value = 0;
      masterGainRef.current.connect(ctxRef.current.destination);
    }
    return ctxRef.current;
  }, []);

  const startAmbient = useCallback(() => {
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume();
    if (state.isPlaying) return;

    const master = masterGainRef.current!;
    const nodes: AudioNode[] = [];
    const intervals: ReturnType<typeof setInterval>[] = [];
    const isRot = mode === 'rot';

    // === 1. Breathing Drone Pad — two detuned oscillators creating warmth ===
    const droneFreqs = isRot ? [55, 82.5] : [65.4, 98]; // C2+G2 or C2+G2 in different keys
    droneFreqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.detune.value = (i === 0 ? -3 : 3); // slight detuning for chorus

      const gain = ctx.createGain();
      gain.gain.value = 0;

      // Breathing LFO on amplitude — slow inhale/exhale
      const breathLfo = ctx.createOscillator();
      breathLfo.type = 'sine';
      breathLfo.frequency.value = isRot ? 0.06 : 0.04; // slower in prune mode
      const breathDepth = ctx.createGain();
      breathDepth.gain.value = isRot ? 0.018 : 0.012;
      breathLfo.connect(breathDepth);
      breathDepth.connect(gain.gain);
      breathLfo.start();

      // Set base level
      gain.gain.value = isRot ? 0.025 : 0.02;

      // Gentle lowpass to soften harmonics
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 400;
      filter.Q.value = 0.5;

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(master);
      osc.start();
      nodes.push(osc, breathLfo);
    });

    // === 2. Harmonic Shimmer — upper partials that drift ===
    const shimmerFreqs = isRot ? [220, 330] : [261.6, 392]; // octave + fifth
    shimmerFreqs.forEach((freq) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const gain = ctx.createGain();
      gain.gain.value = 0.004;

      // Slow random drift on frequency
      const driftLfo = ctx.createOscillator();
      driftLfo.type = 'sine';
      driftLfo.frequency.value = 0.03 + Math.random() * 0.02;
      const driftDepth = ctx.createGain();
      driftDepth.gain.value = 3; // ±3Hz drift
      driftLfo.connect(driftDepth);
      driftDepth.connect(osc.frequency);
      driftLfo.start();

      // Amplitude drift — fading in and out like distant bells
      const ampLfo = ctx.createOscillator();
      ampLfo.type = 'sine';
      ampLfo.frequency.value = 0.02 + Math.random() * 0.015;
      const ampDepth = ctx.createGain();
      ampDepth.gain.value = 0.003;
      ampLfo.connect(ampDepth);
      ampDepth.connect(gain.gain);
      ampLfo.start();

      // Highpass to keep it ethereal
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 200;

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(master);
      osc.start();
      nodes.push(osc, driftLfo, ampLfo);
    });

    // === 3. Ethereal Noise Bed — soft pink noise filtered to warmth ===
    const noiseBuffer = createEtherealNoiseBuffer(ctx, 6);
    const noiseNode = ctx.createBufferSource();
    noiseNode.buffer = noiseBuffer;
    noiseNode.loop = true;

    const noiseLowpass = ctx.createBiquadFilter();
    noiseLowpass.type = 'lowpass';
    noiseLowpass.frequency.value = isRot ? 1800 : 1200;
    noiseLowpass.Q.value = 0.3;

    const noiseHighpass = ctx.createBiquadFilter();
    noiseHighpass.type = 'highpass';
    noiseHighpass.frequency.value = 200;

    const noiseGain = ctx.createGain();
    noiseGain.gain.value = isRot ? 0.015 : 0.008;

    // Breathing on noise too
    const noiseBreathLfo = ctx.createOscillator();
    noiseBreathLfo.type = 'sine';
    noiseBreathLfo.frequency.value = 0.035;
    const noiseBreathDepth = ctx.createGain();
    noiseBreathDepth.gain.value = 0.005;
    noiseBreathLfo.connect(noiseBreathDepth);
    noiseBreathDepth.connect(noiseGain.gain);
    noiseBreathLfo.start();

    noiseNode.connect(noiseHighpass);
    noiseHighpass.connect(noiseLowpass);
    noiseLowpass.connect(noiseGain);
    noiseGain.connect(master);
    noiseNode.start();
    nodes.push(noiseNode, noiseBreathLfo);

    // === 4. Occasional Harmonic Chimes — random soft tones ===
    const chimeInterval = setInterval(() => {
      if (Math.random() > 0.3) return; // only trigger ~30% of the time
      const chimeCtx = ctxRef.current;
      const chimeMaster = masterGainRef.current;
      if (!chimeCtx || !chimeMaster) return;

      const chimeFreqs = isRot
        ? [196, 233, 294, 349, 440]   // G3 Bb3 D4 F4 A4 — minor tension
        : [262, 330, 392, 494, 523];   // C4 E4 G4 B4 C5 — major warmth

      const freq = chimeFreqs[Math.floor(Math.random() * chimeFreqs.length)];
      const osc = chimeCtx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const gain = chimeCtx.createGain();
      const filter = chimeCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1000;

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(chimeMaster);

      const now = chimeCtx.currentTime;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.008, now + 0.8);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 4);
      osc.start(now);
      osc.stop(now + 4.1);
    }, 8000);
    intervals.push(chimeInterval);

    // === 5. Sub-harmonic presence (felt more than heard) ===
    const subOsc = ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.value = isRot ? 30 : 36;
    const subGain = ctx.createGain();
    subGain.gain.value = isRot ? 0.02 : 0.012;

    const subLfo = ctx.createOscillator();
    subLfo.type = 'sine';
    subLfo.frequency.value = 0.05;
    const subLfoDepth = ctx.createGain();
    subLfoDepth.gain.value = 0.008;
    subLfo.connect(subLfoDepth);
    subLfoDepth.connect(subGain.gain);
    subLfo.start();

    subOsc.connect(subGain);
    subGain.connect(master);
    subOsc.start();
    nodes.push(subOsc, subLfo);

    nodesRef.current = nodes;
    intervalsRef.current = intervals;

    // Gentle fade in — 4 seconds
    const now = ctx.currentTime;
    master.gain.setValueAtTime(0, now);
    master.gain.linearRampToValueAtTime(state.volume * 0.18, now + 4);

    setState((s) => ({ ...s, isPlaying: true }));
  }, [getCtx, state.isPlaying, state.volume, mode]);

  const stopAmbient = useCallback(() => {
    const ctx = ctxRef.current;
    const master = masterGainRef.current;
    if (!ctx || !master) return;

    // Gentle fade out — 3 seconds
    const now = ctx.currentTime;
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(0, now + 3);

    setTimeout(() => {
      nodesRef.current.forEach((node) => {
        try {
          if ('stop' in node && typeof (node as any).stop === 'function') {
            (node as any).stop();
          }
        } catch {}
      });
      nodesRef.current = [];
      intervalsRef.current.forEach((id) => clearInterval(id));
      intervalsRef.current = [];
      setState((s) => ({ ...s, isPlaying: false }));
    }, 3200);
  }, []);

  const setVolume = useCallback((v: number) => {
    setState((s) => ({ ...s, volume: v }));
    if (masterGainRef.current && ctxRef.current) {
      const now = ctxRef.current.currentTime;
      masterGainRef.current.gain.setValueAtTime(masterGainRef.current.gain.value, now);
      masterGainRef.current.gain.linearRampToValueAtTime(v * 0.18, now + 0.5);
    }
  }, []);

  // Update based on decay level
  const updateDecayInfluence = useCallback((decayLevel: number) => {
    decayRef.current = decayLevel;
  }, []);

  // === Interaction sounds — ethereal, organic ===

  const playCreateSound = useCallback(() => {
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume();

    // Soft ascending chord — a thought crystallizing
    const freqs = [330, 440, 523];
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 800;
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      const offset = i * 0.06;
      gain.gain.setValueAtTime(0, now + offset);
      gain.gain.linearRampToValueAtTime(0.02, now + offset + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.7);
      osc.start(now + offset);
      osc.stop(now + offset + 0.8);
    });
  }, [getCtx]);

  const playDeleteSound = useCallback(() => {
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume();

    // Descending breath — releasing
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 500;
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 1);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.02, now + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1);
    osc.start(now);
    osc.stop(now + 1.1);
  }, [getCtx]);

  const playDissolveSound = useCallback(() => {
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume();

    // Deep dissolution — chord descending into noise
    const freqs = [200, 150, 100];
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      const offset = i * 0.15;
      osc.frequency.setValueAtTime(freq, now + offset);
      osc.frequency.exponentialRampToValueAtTime(30, now + offset + 2.5);
      gain.gain.setValueAtTime(0, now + offset);
      gain.gain.linearRampToValueAtTime(0.025, now + offset + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 2.5);
      osc.start(now + offset);
      osc.stop(now + offset + 2.6);
    });

    // Noise wash
    const noiseBuffer = createEtherealNoiseBuffer(ctx, 3);
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const noiseGain = ctx.createGain();
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 400;
    noiseFilter.Q.value = 0.5;
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    const now = ctx.currentTime;
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(0.02, now + 0.5);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 3);
    noise.start(now);
    noise.stop(now + 3.1);
  }, [getCtx]);

  const playWaterSound = useCallback(() => {
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume();

    // Gentle ascending shimmer — renewal
    const freqs = [262, 330, 392, 523];
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1000;
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      const offset = i * 0.08;
      osc.frequency.setValueAtTime(freq * 0.95, now + offset);
      osc.frequency.linearRampToValueAtTime(freq, now + offset + 0.2);
      gain.gain.setValueAtTime(0, now + offset);
      gain.gain.linearRampToValueAtTime(0.015, now + offset + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.8);
      osc.start(now + offset);
      osc.stop(now + offset + 0.9);
    });
  }, [getCtx]);

  const playModeSwitch = useCallback(() => {
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume();

    // Ritualistic transition — deep chord morph
    const isRot = mode === 'rot';
    const freqs = isRot ? [55, 82.5, 110, 165] : [65.4, 98, 130.8, 196];
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0, now + i * 0.12);
      gain.gain.linearRampToValueAtTime(0.015, now + i * 0.12 + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.12 + 2);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 2.1);
    });
  }, [getCtx, mode]);

  // Cleanup
  useEffect(() => {
    return () => {
      nodesRef.current.forEach((node) => {
        try {
          if ('stop' in node && typeof (node as any).stop === 'function') {
            (node as any).stop();
          }
        } catch {}
      });
      intervalsRef.current.forEach((id) => clearInterval(id));
      if (ctxRef.current) {
        ctxRef.current.close();
      }
    };
  }, []);

  return {
    isPlaying: state.isPlaying,
    volume: state.volume,
    startAmbient,
    stopAmbient,
    setVolume,
    updateDecayInfluence,
    playCreateSound,
    playDeleteSound,
    playDissolveSound,
    playWaterSound,
    playModeSwitch,
  };
}
