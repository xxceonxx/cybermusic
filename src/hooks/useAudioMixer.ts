"use client";

import { useState, useCallback } from "react";

interface MixOptions {
  trackUrls: string[];
  duration: number;
}

export function useAudioMixer() {
  const [mixing, setMixing] = useState(false);
  const [progress, setProgress] = useState(0);

  const mixTracks = useCallback(
    async ({ trackUrls, duration }: MixOptions): Promise<Blob> => {
      setMixing(true);
      setProgress(0);

      try {
        // Create audio elements for each track
        const audioElements = trackUrls.map((url) => {
          const audio = new Audio(url);
          audio.crossOrigin = "anonymous";
          audio.volume = 1;
          return audio;
        });

        // Wait for all to be ready
        await Promise.all(
          audioElements.map(
            (audio) =>
              new Promise<void>((resolve) => {
                audio.addEventListener("canplaythrough", () => resolve(), {
                  once: true,
                });
                audio.load();
              })
          )
        );

        // Create AudioContext and mix streams
        const ctx = new AudioContext();
        const dest = ctx.createMediaStreamDestination();

        for (const audio of audioElements) {
          await audio.play();
          const stream = (audio as HTMLAudioElement & { captureStream?: () => MediaStream; mozCaptureStream?: () => MediaStream })
            .captureStream?.() ??
            (audio as HTMLAudioElement & { mozCaptureStream?: () => MediaStream })
              .mozCaptureStream?.();
          if (stream) {
            ctx.createMediaStreamSource(stream).connect(dest);
          }
        }

        // Record the mixed output
        const mediaRecorder = new MediaRecorder(dest.stream, {
          mimeType: "audio/webm",
        });
        const chunks: BlobPart[] = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        // Track progress
        const startTime = Date.now();
        const progressInterval = setInterval(() => {
          const elapsed = (Date.now() - startTime) / 1000;
          setProgress(Math.min(elapsed / duration, 1));
        }, 500);

        const blob = await new Promise<Blob>((resolve) => {
          mediaRecorder.onstop = () => {
            clearInterval(progressInterval);
            resolve(new Blob(chunks, { type: "audio/webm" }));
          };

          mediaRecorder.start();
          setTimeout(() => {
            mediaRecorder.stop();
            audioElements.forEach((a) => a.pause());
            ctx.close();
          }, duration * 1000);
        });

        setProgress(1);
        return blob;
      } finally {
        setMixing(false);
      }
    },
    []
  );

  return { mixing, progress, mixTracks };
}
