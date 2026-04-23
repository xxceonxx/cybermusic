const INSTRUMENT_RGB: Record<string, [number, number, number]> = {
  Bass: [59, 130, 246],
  AGuitar: [239, 68, 68],
  EGuitar: [249, 115, 22],
  Drums: [234, 179, 8],
  Harp: [139, 92, 246],
  Flute: [236, 72, 153],
  Percussion: [245, 158, 11],
  Piano: [124, 58, 237],
  Saxophone: [234, 88, 12],
  Triangle: [6, 182, 212],
  Violine: [217, 70, 239],
  Vocals: [16, 185, 129],
};

export function getTrackColor(instrument: string, alpha: number): string {
  const c = INSTRUMENT_RGB[instrument] ?? [107, 114, 128];
  return `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${alpha})`;
}

export const TRACK_HEIGHT = 120;
