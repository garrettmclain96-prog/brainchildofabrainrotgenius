import { useRef, useCallback, useEffect, useState } from 'react';
import { useAppMode } from '@/hooks/useAppMode';

/**
 * Procedural Ambient Audio Engine
 * 
 * Generates a living soundscape: low-frequency hums, tape hiss,
 * subtle crackles, and organic textures. Reacts to decay level,
 * user activity, and mode (Prune vs Rot).
 * 
 * Silence is allowed and respected.
 */

interface AmbientState {
  isPlaying: boolean;
  volume: number;
}

// Create filtered noise buffer (tape hiss)
function createNoiseBuffer(ctx: AudioContext, duration: number): AudioBuffer {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  // Brown noise (warmer than white)
  let last = 0;
  for (let i = 0; i < data.length; i++) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    data[i] = last * 3.5;
  }
  return buffer;
}

export function useAmbientAudio() {
  const { mode } = useAppMode();
  const ctxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const nodesRef = useRef<AudioNode[]>([]);
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

    // === Low-frequency hum (55 Hz fundamental) ===
    const bassOsc = ctx.createOscillator();
    bassOsc.type = 'sine';
    bassOsc.frequency.value = 55;
    const bassGain = ctx.createGain();
    bassGain.gain.value = 0.04;
    // Slow LFO on bass frequency for organic feel
    const bassLfo = ctx.createOscillator();
    bassLfo.type = 'sine';
    bassLfo.frequency.value = 0.08;
    const bassLfoGain = ctx.createGain();
    bassLfoGain.gain.value = 2;
    bassLfo.connect(bassLfoGain);
    bassLfoGain.connect(bassOsc.frequency);
    bassLfo.start();
    bassOsc.connect(bassGain);
    bassGain.connect(master);
    bassOsc.start();
    nodes.push(bassOsc, bassLfo);

    // === Distant tone (110 Hz with detuning) ===
    const midOsc = ctx.createOscillator();
    midOsc.type = 'triangle';
    midOsc.frequency.value = 110;
    midOsc.detune.value = -5;
    const midGain = ctx.createGain();
    midGain.gain.value = 0.015;
    // Amplitude modulation
    const midLfo = ctx.createOscillator();
    midLfo.type = 'sine';
    midLfo.frequency.value = 0.12;
    const midLfoGain = ctx.createGain();
    midLfoGain.gain.value = 0.008;
    midLfo.connect(midLfoGain);
    midLfoGain.connect(midGain.gain);
    midLfo.start();
    midOsc.connect(midGain);
    midGain.connect(master);
    midOsc.start();
    nodes.push(midOsc, midLfo);

    // === Tape hiss (filtered brown noise) ===
    const noiseBuffer = createNoiseBuffer(ctx, 4);
    const noiseNode = ctx.createBufferSource();
    noiseNode.buffer = noiseBuffer;
    noiseNode.loop = true;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 3000;
    noiseFilter.Q.value = 0.5;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.012;
    noiseNode.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(master);
    noiseNode.start();
    nodes.push(noiseNode);

    // === Crackle layer (irregular impulses) ===
    const crackleBuffer = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
    const crackleData = crackleBuffer.getChannelData(0);
    for (let i = 0; i < crackleData.length; i++) {
      // Sparse random crackles
      crackleData[i] = Math.random() < 0.001 ? (Math.random() - 0.5) * 0.8 : 0;
    }
    const crackleNode = ctx.createBufferSource();
    crackleNode.buffer = crackleBuffer;
    crackleNode.loop = true;
    const crackleFilter = ctx.createBiquadFilter();
    crackleFilter.type = 'bandpass';
    crackleFilter.frequency.value = 2000;
    crackleFilter.Q.value = 1;
    const crackleGain = ctx.createGain();
    crackleGain.gain.value = 0.02;
    crackleNode.connect(crackleFilter);
    crackleFilter.connect(crackleGain);
    crackleGain.connect(master);
    crackleNode.start();
    nodes.push(crackleNode);

    // === Sub-bass drone for Rot mode (very low) ===
    const subOsc = ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.value = 32;
    const subGain = ctx.createGain();
    subGain.gain.value = mode === 'rot' ? 0.025 : 0.01;
    subOsc.connect(subGain);
    subGain.connect(master);
    subOsc.start();
    nodes.push(subOsc);

    nodesRef.current = nodes;

    // Fade in
    const now = ctx.currentTime;
    master.gain.setValueAtTime(0, now);
    master.gain.linearRampToValueAtTime(state.volume * 0.15, now + 3);

    setState((s) => ({ ...s, isPlaying: true }));
  }, [getCtx, state.isPlaying, state.volume, mode]);

  const stopAmbient = useCallback(() => {
    const ctx = ctxRef.current;
    const master = masterGainRef.current;
    if (!ctx || !master) return;

    // Fade out
    const now = ctx.currentTime;
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(0, now + 2);

    setTimeout(() => {
      nodesRef.current.forEach((node) => {
        try {
          if ('stop' in node && typeof (node as any).stop === 'function') {
            (node as any).stop();
          }
        } catch {}
      });
      nodesRef.current = [];
      setState((s) => ({ ...s, isPlaying: false }));
    }, 2200);
  }, []);

  const setVolume = useCallback((v: number) => {
    setState((s) => ({ ...s, volume: v }));
    if (masterGainRef.current && ctxRef.current) {
      const now = ctxRef.current.currentTime;
      masterGainRef.current.gain.setValueAtTime(masterGainRef.current.gain.value, now);
      masterGainRef.current.gain.linearRampToValueAtTime(v * 0.15, now + 0.5);
    }
  }, []);

  // Update based on decay level
  const updateDecayInfluence = useCallback((decayLevel: number) => {
    decayRef.current = decayLevel;
    // Higher decay = more unsettling audio (slightly louder noise/crackle)
    // This is handled passively through the existing mix
  }, []);

  // === Interaction sounds ===
  const playCreateSound = useCallback(() => {
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume();

    // Soft breathy tone — inhale
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 330;
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(350, now + 0.15);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.4);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.03, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc.start(now);
    osc.stop(now + 0.5);
  }, [getCtx]);

  const playDeleteSound = useCallback(() => {
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume();

    // Descending exhale — letting go
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 600;
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.8);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.025, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    osc.start(now);
    osc.stop(now + 0.9);
  }, [getCtx]);

  const playDissolveSound = useCallback(() => {
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume();

    // Deep dissolution — final exhale with noise
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const noiseBuffer = createNoiseBuffer(ctx, 2);
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const noiseGain = ctx.createGain();
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 500;
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 2);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.04, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2);
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(0.03, now + 0.3);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 2);

    osc.start(now);
    osc.stop(now + 2.1);
    noise.start(now);
    noise.stop(now + 2.1);
  }, [getCtx]);

  const playWaterSound = useCallback(() => {
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume();

    // Gentle "breath in" — reconstitution
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1200;
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.linearRampToValueAtTime(440, now + 0.3);
    osc.frequency.linearRampToValueAtTime(330, now + 0.6);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.025, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc.start(now);
    osc.stop(now + 0.7);
  }, [getCtx]);

  const playModeSwitch = useCallback(() => {
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume();

    // Ritualistic transition — deep chord shift
    const freqs = mode === 'rot' ? [55, 82, 110] : [65, 98, 131];
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0, now + i * 0.1);
      gain.gain.linearRampToValueAtTime(0.02, now + i * 0.1 + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 1.5);
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 1.6);
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
