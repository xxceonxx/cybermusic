"use client";

import { useState, useCallback, useRef } from "react";

interface RecorderResult {
  blob: Blob;
  url: string;
  duration: number;
}

export function useRecorder() {
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const startTimeRef = useRef(0);

  const startRecording = useCallback(async (): Promise<void> => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm",
    });

    chunksRef.current = [];
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mediaRecorder.start(100);
    startTimeRef.current = Date.now();
    setRecording(true);
    setRecordingTime(0);

    timerRef.current = setInterval(() => {
      setRecordingTime((Date.now() - startTimeRef.current) / 1000);
    }, 100);
  }, []);

  const stopRecording = useCallback((): Promise<RecorderResult> => {
    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current;
      if (!mediaRecorder) throw new Error("Not recording");

      clearInterval(timerRef.current);

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        const duration = (Date.now() - startTimeRef.current) / 1000;

        // Stop all tracks to release microphone
        mediaRecorder.stream.getTracks().forEach((t) => t.stop());

        setRecording(false);
        resolve({ blob, url, duration });
      };

      mediaRecorder.stop();
    });
  }, []);

  const cancelRecording = useCallback(() => {
    const mediaRecorder = mediaRecorderRef.current;
    if (!mediaRecorder) return;
    clearInterval(timerRef.current);
    mediaRecorder.stream.getTracks().forEach((t) => t.stop());
    mediaRecorder.stop();
    setRecording(false);
    setRecordingTime(0);
  }, []);

  return { recording, recordingTime, startRecording, stopRecording, cancelRecording };
}
