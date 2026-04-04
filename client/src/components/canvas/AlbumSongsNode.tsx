import { useState, useEffect, memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { api } from "@/services/api";
import { X, Music, Loader2 } from "lucide-react";

interface Song {
  id: string;
  title: string;
  track_number: number;
  duration_seconds?: number;
}

interface Album {
  id: string;
  title: string;
}

interface AlbumSongsNodeProps {
  id: string;
  data: {
    album: Album;
    artistId: string;
    onClose: (id: string) => void;
  };
}

function formatDuration(seconds?: number) {
  if (!seconds) return '--:--';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function AlbumSongsNodeComponent({ id, data }: AlbumSongsNodeProps) {
  const { album } = data;
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const fetchSongs = async () => {
    try {
      setIsLoading(true);
      const res = await api.getAlbumSongs(album.id);
      const fetchedSongs = res.data.songs || [];
      setSongs(fetchedSongs.sort((a: Song, b: Song) => a.track_number - b.track_number));
    } catch (err) {
      console.error("Failed to fetch songs", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSongs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [album.id]);



  return (
    <div className="w-[420px] bg-white border border-gray-200 rounded-3xl shadow-xl overflow-hidden transition-all duration-300 animate-in fade-in zoom-in-95">
      {/* Left Handle: Connects from Album Node */}
      <Handle type="target" position={Position.Left} className="!w-4 !h-4 !bg-black !border-[3px] !border-black" />

      <div className="flex flex-row items-start justify-between p-6 pb-2 w-full relative z-10">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Album Tracks</span>
          <h3 className="text-xl font-bold leading-tight truncate w-48">{album.title}</h3>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => data.onClose(id)}
            className="p-1.5 rounded-full bg-white border border-gray-200 hover:bg-gray-100 transition-colors text-gray-500 hover:text-black nodrag"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-5 max-h-[400px] overflow-y-auto custom-scrollbar nodrag">


        <div className="space-y-1">
          {isLoading ? (
             <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-gray-300" /></div>
          ) : songs.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">No tracks in this album yet.</p>
          ) : (
            songs.map((song) => (
              <div key={song.id || song.track_number} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-all duration-200 border border-transparent hover:border-gray-100 group">
                <span className="text-sm font-bold text-gray-300 w-5 text-right font-mono group-hover:text-black transition-colors">{song.track_number}</span>
                <span className="flex-1 text-sm font-semibold text-gray-800 group-hover:text-black transition-colors">{song.title}</span>
                <span className="text-xs text-gray-400 font-medium bg-gray-100 px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  <Music className="w-3 h-3"/> {formatDuration(song.duration_seconds)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export const AlbumSongsNode = memo(AlbumSongsNodeComponent);
