"use client";

import { useState, useCallback } from "react";

interface ExportOptions {
  tracks: { name: string; instrument: string; url: string }[];
  songName: string;
  bpm: number;
  duration: number;
}

export function useAudioExport() {
  const [exporting, setExporting] = useState(false);

  /** Download a single track as its original format */
  const downloadTrack = useCallback(async (url: string, filename: string) => {
    const res = await fetch(url);
    const blob = await res.blob();
    const ext = blob.type.includes("wav")
      ? "wav"
      : blob.type.includes("mp3") || blob.type.includes("mpeg")
      ? "mp3"
      : blob.type.includes("ogg")
      ? "ogg"
      : "webm";
    triggerDownload(blob, `${filename}.${ext}`);
  }, []);

  /** Export all stems as individual files + project info JSON */
  const exportStems = useCallback(
    async ({ tracks, songName, bpm, duration }: ExportOptions) => {
      setExporting(true);
      try {
        // Download each stem
        for (const track of tracks) {
          const safeName = `${songName} - ${track.instrument}`.replace(
            /[^a-zA-Z0-9 _-]/g,
            ""
          );
          await downloadTrack(track.url, safeName);
        }

        // Generate project info file for external DAWs
        const projectInfo = {
          name: songName,
          bpm,
          duration,
          sampleRate: 44100,
          tracks: tracks.map((t, i) => ({
            index: i + 1,
            name: t.instrument,
            filename: `${songName} - ${t.instrument}`,
            startTime: 0,
          })),
          exportedAt: new Date().toISOString(),
          exportedFrom: "Cybermusic",
        };

        const infoBlob = new Blob([JSON.stringify(projectInfo, null, 2)], {
          type: "application/json",
        });
        triggerDownload(infoBlob, `${songName} - Project Info.json`);
      } finally {
        setExporting(false);
      }
    },
    [downloadTrack]
  );

  /** Export mixed master using OfflineAudioContext (WAV quality) */
  const exportMaster = useCallback(
    async ({ tracks, songName, bpm, duration }: ExportOptions) => {
      setExporting(true);
      try {
        const sampleRate = 44100;
        const offlineCtx = new OfflineAudioContext(
          2,
          sampleRate * duration,
          sampleRate
        );

        // Fetch and decode all audio buffers
        const buffers = await Promise.all(
          tracks.map(async (t) => {
            const res = await fetch(t.url);
            const arrayBuf = await res.arrayBuffer();
            return offlineCtx.decodeAudioData(arrayBuf);
          })
        );

        // Connect all sources to the offline context
        for (const buffer of buffers) {
          const source = offlineCtx.createBufferSource();
          source.buffer = buffer;
          source.connect(offlineCtx.destination);
          source.start(0);
        }

        // Render
        const rendered = await offlineCtx.startRendering();

        // Encode as WAV
        const wavBlob = audioBufferToWav(rendered);
        triggerDownload(
          wavBlob,
          `${songName} - Master Mix.wav`
        );
      } finally {
        setExporting(false);
      }
    },
    []
  );

  return { exporting, exportStems, exportMaster, downloadTrack };
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Encode an AudioBuffer as a WAV file */
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const length = buffer.length;
  const bytesPerSample = 2; // 16-bit
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = length * blockAlign;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;

  const arrayBuffer = new ArrayBuffer(totalSize);
  const view = new DataView(arrayBuffer);

  // WAV header
  writeString(view, 0, "RIFF");
  view.setUint32(4, totalSize - 8, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true); // chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // bits per sample
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  // Interleave channels and write samples
  const channels: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) {
    channels.push(buffer.getChannelData(c));
  }

  let offset = headerSize;
  for (let i = 0; i < length; i++) {
    for (let c = 0; c < numChannels; c++) {
      const sample = Math.max(-1, Math.min(1, channels[c][i]));
      view.setInt16(offset, sample * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
