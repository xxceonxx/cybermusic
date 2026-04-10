"use client";

import { useRef, useCallback, useState } from "react";

export function useMetronome() {
  const [active, setActive] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const start = useCallback((bpm: number) => {
    stop();
    const ctx = new AudioContext();
    ctxRef.current = ctx;
    const ms = 60000 / bpm;

    const tick = () => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 1000;
      gain.gain.value = 0.3;
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.05);
    };

    tick();
    intervalRef.current = setInterval(tick, ms);
    setActive(true);
  }, []);

  const stop = useCallback(() => {
    clearInterval(intervalRef.current);
    ctxRef.current?.close();
    ctxRef.current = null;
    setActive(false);
  }, []);

  const toggle = useCallback(
    (bpm: number) => {
      if (active) stop();
      else start(bpm);
    },
    [active, start, stop]
  );

  return { metronomeActive: active, toggleMetronome: toggle, stopMetronome: stop };
}
