"use client";

import { useAudioExport } from "@/hooks/useAudioExport";
import { useToast } from "@/components/ui/Toast";
import type { Song, Track } from "@/types";

interface ExportPanelProps {
  song: Song;
  tracks: Track[];
}

export function ExportPanel({ song, tracks }: ExportPanelProps) {
  const { exporting, exportStems, exportMaster, downloadTrack } =
    useAudioExport();
  const { toast } = useToast();

  const uploadedTracks = tracks.filter((t) => t.ipfsUrl);

  if (uploadedTracks.length === 0) return null;

  const exportOptions = {
    tracks: uploadedTracks.map((t) => ({
      name: t.instrument,
      instrument: t.instrument,
      url: t.ipfsUrl!,
    })),
    songName: song.name,
    bpm: song.bpm,
    duration: song.duration,
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-zinc-300 mb-1">
        Export / Import
      </h3>
      <p className="text-xs text-zinc-500 mb-4">
        Download stems for your external DAW (Ableton, Logic, FL Studio) or
        export a mixed master.
      </p>

      <div className="flex flex-wrap gap-2">
        {/* Export all stems */}
        <button
          onClick={async () => {
            try {
              await exportStems(exportOptions);
              toast(
                `${uploadedTracks.length} stems + project info exported`,
                "success"
              );
            } catch {
              toast("Export failed", "error");
            }
          }}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 rounded-lg text-sm transition"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="text-blue-400"
          >
            <path d="M8 1v9m0 0L5 7m3 3l3-3M2 12v1a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-1" stroke="currentColor" strokeWidth="1.5" fill="none" />
          </svg>
          {exporting ? "Exporting..." : "Download Stems"}
        </button>

        {/* Export master mix as WAV */}
        <button
          onClick={async () => {
            try {
              await exportMaster(exportOptions);
              toast("Master WAV exported", "success");
            } catch {
              toast("Master export failed", "error");
            }
          }}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 rounded-lg text-sm transition"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="text-emerald-400"
          >
            <path d="M8 1v9m0 0L5 7m3 3l3-3M2 12v1a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-1" stroke="currentColor" strokeWidth="1.5" fill="none" />
          </svg>
          {exporting ? "Rendering..." : "Export Master (WAV)"}
        </button>

        {/* Individual track downloads */}
        {uploadedTracks.length > 1 && (
          <div className="w-full mt-2">
            <p className="text-[10px] uppercase tracking-wider text-zinc-600 mb-1.5">
              Individual tracks
            </p>
            <div className="flex flex-wrap gap-1.5">
              {uploadedTracks.map((track) => (
                <button
                  key={track.id}
                  onClick={async () => {
                    try {
                      await downloadTrack(
                        track.ipfsUrl!,
                        `${song.name} - ${track.instrument}`
                      );
                      toast(`${track.instrument} downloaded`, "success");
                    } catch {
                      toast("Download failed", "error");
                    }
                  }}
                  className="px-2.5 py-1 text-xs bg-zinc-800/60 hover:bg-zinc-700 border border-zinc-700/50 rounded-md transition"
                >
                  {track.instrument}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Import hint */}
      <div className="mt-4 pt-3 border-t border-zinc-800/60">
        <p className="text-[10px] text-zinc-600">
          <strong className="text-zinc-500">Import tip:</strong> The project
          info JSON contains BPM, duration, and track layout. In Ableton, set
          the tempo to {song.bpm} BPM and drag stems onto separate tracks. All
          stems start at 0:00.
        </p>
      </div>
    </div>
  );
}
