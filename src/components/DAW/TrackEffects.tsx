"use client";

import { useState } from "react";

export interface EffectValues {
  reverbMix: number;
  delayTime: number;
  delayFeedback: number;
  eqLow: number;
  eqMid: number;
  eqHigh: number;
}

export const DEFAULT_EFFECTS: EffectValues = {
  reverbMix: 0,
  delayTime: 0,
  delayFeedback: 0,
  eqLow: 0,
  eqMid: 0,
  eqHigh: 0,
};

interface TrackEffectsProps {
  values: EffectValues;
  onChange: (values: EffectValues) => void;
  onClose: () => void;
  instrument: string;
}

export function TrackEffects({ values, onChange, onClose, instrument }: TrackEffectsProps) {
  const update = (key: keyof EffectValues, val: number) => {
    onChange({ ...values, [key]: val });
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs">
      <div className="flex items-center justify-between mb-3">
        <span className="font-medium text-zinc-300">FX: {instrument}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onChange(DEFAULT_EFFECTS)}
            className="text-zinc-600 hover:text-zinc-400 transition"
          >
            Reset
          </button>
          <button
            onClick={onClose}
            className="text-zinc-600 hover:text-white transition"
          >
            &times;
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {/* Reverb */}
        <div>
          <label className="block text-zinc-500 mb-1">Reverb</label>
          <input
            type="range"
            min={0}
            max={100}
            value={values.reverbMix}
            onChange={(e) => update("reverbMix", Number(e.target.value))}
            className="w-full h-1 accent-purple-500"
          />
          <span className="text-zinc-600">{values.reverbMix}%</span>
        </div>

        {/* Delay Time */}
        <div>
          <label className="block text-zinc-500 mb-1">Delay</label>
          <input
            type="range"
            min={0}
            max={100}
            value={values.delayTime}
            onChange={(e) => update("delayTime", Number(e.target.value))}
            className="w-full h-1 accent-blue-500"
          />
          <span className="text-zinc-600">{values.delayTime}%</span>
        </div>

        {/* Delay Feedback */}
        <div>
          <label className="block text-zinc-500 mb-1">Feedback</label>
          <input
            type="range"
            min={0}
            max={100}
            value={values.delayFeedback}
            onChange={(e) => update("delayFeedback", Number(e.target.value))}
            className="w-full h-1 accent-blue-400"
          />
          <span className="text-zinc-600">{values.delayFeedback}%</span>
        </div>

        {/* EQ Low */}
        <div>
          <label className="block text-zinc-500 mb-1">Low</label>
          <input
            type="range"
            min={-12}
            max={12}
            value={values.eqLow}
            onChange={(e) => update("eqLow", Number(e.target.value))}
            className="w-full h-1 accent-red-500"
          />
          <span className="text-zinc-600">{values.eqLow > 0 ? "+" : ""}{values.eqLow}dB</span>
        </div>

        {/* EQ Mid */}
        <div>
          <label className="block text-zinc-500 mb-1">Mid</label>
          <input
            type="range"
            min={-12}
            max={12}
            value={values.eqMid}
            onChange={(e) => update("eqMid", Number(e.target.value))}
            className="w-full h-1 accent-yellow-500"
          />
          <span className="text-zinc-600">{values.eqMid > 0 ? "+" : ""}{values.eqMid}dB</span>
        </div>

        {/* EQ High */}
        <div>
          <label className="block text-zinc-500 mb-1">High</label>
          <input
            type="range"
            min={-12}
            max={12}
            value={values.eqHigh}
            onChange={(e) => update("eqHigh", Number(e.target.value))}
            className="w-full h-1 accent-cyan-500"
          />
          <span className="text-zinc-600">{values.eqHigh > 0 ? "+" : ""}{values.eqHigh}dB</span>
        </div>
      </div>
    </div>
  );
}
