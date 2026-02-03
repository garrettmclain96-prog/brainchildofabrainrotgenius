import { useRef, useCallback, useEffect } from 'react';

// Create ambient drone sound using Web Audio API
const createAmbientDrone = (audioContext: AudioContext): OscillatorNode[] => {
  const oscillators: OscillatorNode[] = [];
  
  // Deep bass drone
  const bass = audioContext.createOscillator();
  bass.type = 'sine';
  bass.frequency.value = 55; // Low A
  const bassGain = audioContext.createGain();
  bassGain.gain.value = 0.03;
  bass.connect(bassGain);
  bassGain.connect(audioContext.destination);
  oscillators.push(bass);
  
  // Mid ethereal tone
  const mid = audioContext.createOscillator();
  mid.type = 'sine';
  mid.frequency.value = 110;
  const midGain = audioContext.createGain();
  midGain.gain.value = 0.015;
  mid.connect(midGain);
  midGain.connect(audioContext.destination);
  oscillators.push(mid);
  
  // High shimmer
  const high = audioContext.createOscillator();
  high.type = 'sine';
  high.frequency.value = 440;
  const highGain = audioContext.createGain();
  highGain.gain.value = 0.005;
  high.connect(highGain);
  highGain.connect(audioContext.destination);
  oscillators.push(high);
  
  return oscillators;
};

// Create soft typing/click sound
const createTypingSound = (audioContext: AudioContext) => {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();
  
  // Short click-like sound
  oscillator.type = 'sine';
  oscillator.frequency.value = 800 + Math.random() * 400;
  
  filter.type = 'lowpass';
  filter.frequency.value = 2000;
  
  oscillator.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  // Very quick envelope
  const now = audioContext.currentTime;
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(0.02, now + 0.005);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
  
  oscillator.start(now);
  oscillator.stop(now + 0.05);
};

// Create whoosh/transition sound
const createWhooshSound = (audioContext: AudioContext) => {
  const noise = audioContext.createBufferSource();
  const noiseBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.5, audioContext.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  
  for (let i = 0; i < noiseData.length; i++) {
    noiseData[i] = (Math.random() * 2 - 1) * 0.5;
  }
  
  noise.buffer = noiseBuffer;
  
  const filter = audioContext.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 1000;
  filter.Q.value = 0.5;
  
  const gainNode = audioContext.createGain();
  
  noise.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  const now = audioContext.currentTime;
  filter.frequency.setValueAtTime(500, now);
  filter.frequency.exponentialRampToValueAtTime(2000, now + 0.2);
  filter.frequency.exponentialRampToValueAtTime(500, now + 0.4);
  
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(0.03, now + 0.1);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
  
  noise.start(now);
  noise.stop(now + 0.5);
};

export const useIntroSounds = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);
  const isPlayingRef = useRef(false);

  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    return audioContextRef.current;
  }, []);

  const startAmbient = useCallback(() => {
    if (isPlayingRef.current) return;
    
    const ctx = initAudio();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    
    oscillatorsRef.current = createAmbientDrone(ctx);
    oscillatorsRef.current.forEach(osc => osc.start());
    isPlayingRef.current = true;
  }, [initAudio]);

  const stopAmbient = useCallback(() => {
    oscillatorsRef.current.forEach(osc => {
      try {
        osc.stop();
      } catch {
        // Already stopped
      }
    });
    oscillatorsRef.current = [];
    isPlayingRef.current = false;
  }, []);

  const playTyping = useCallback(() => {
    const ctx = initAudio();
    if (ctx.state === 'suspended') return;
    createTypingSound(ctx);
  }, [initAudio]);

  const playWhoosh = useCallback(() => {
    const ctx = initAudio();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    createWhooshSound(ctx);
  }, [initAudio]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAmbient();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stopAmbient]);

  return {
    startAmbient,
    stopAmbient,
    playTyping,
    playWhoosh,
  };
};
