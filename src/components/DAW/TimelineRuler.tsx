"use client";

import { useEffect, useRef } from "react";

interface TimelineRulerProps {
  duration: number;
  onSeekDown: (e: React.MouseEvent) => void;
}

export function TimelineRuler({ duration, onSeekDown }: TimelineRulerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || duration <= 0) return;

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, rect.width, rect.height);

      const tickInterval = duration <= 30 ? 1 : duration <= 120 ? 5 : 10;
      const majorInterval = tickInterval * (duration <= 30 ? 5 : 2);

      for (let t = 0; t <= duration; t += tickInterval) {
        const x = (t / duration) * rect.width;
        const isMajor = t % majorInterval === 0;
        ctx.beginPath();
        ctx.moveTo(x, isMajor ? 0 : rect.height * 0.55);
        ctx.lineTo(x, rect.height);
        ctx.strokeStyle = isMajor ? "#52525b" : "#3f3f46";
        ctx.lineWidth = isMajor ? 1 : 0.5;
        ctx.stroke();

        if (isMajor) {
          const m = Math.floor(t / 60);
          const s = t % 60;
          ctx.fillStyle = "#71717a";
          ctx.font = "10px ui-monospace, monospace";
          ctx.fillText(`${m}:${s.toString().padStart(2, "0")}`, x + 3, 11);
        }
      }
    };

    draw();
    const obs = new ResizeObserver(draw);
    obs.observe(canvas);
    return () => obs.disconnect();
  }, [duration]);

  return (
    <div
      className="h-8 border-b border-zinc-800/40 bg-[#0e0e10] relative cursor-pointer"
      onMouseDown={onSeekDown}
    >
      <canvas ref={canvasRef} className="w-full h-full" style={{ display: "block" }} />
    </div>
  );
}
