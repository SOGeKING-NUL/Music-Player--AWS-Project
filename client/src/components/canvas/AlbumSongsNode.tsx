import { useState, useEffect, memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { api } from "@/services/api";
import { X, Loader2, Play } from "lucide-react";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";

interface Song {
  id: string;
  title: string;
  track_number: number;
  duration_seconds?: number;
  s3_audio_key: string;
}

interface Album {
  id: string;
  title: string;
  s3_cover_key?: string;
}

interface AlbumSongsNodeProps {
  id: string;
  data: {
    album: Album;
    artistId: string;
    artistName?: string;
    onClose: (id: string) => void;
  };
}

// formatting duration handled on global components instead

function AlbumSongsNodeComponent({ id, data }: AlbumSongsNodeProps) {
  const { album } = data;
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { playSong, currentTrack, isPlaying } = useMusicPlayer();
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
            songs.map((song) => {
              const isActive = currentTrack?.songId === song.id;
              return (
                <div 
                  key={song.id || song.track_number} 
                  onClick={() => playSong({
                    songId: song.id,
                    title: song.title,
                    artistName: data.artistName || "Unknown Artist", 
                    albumCoverUrl: album.s3_cover_key ? `https://music-player-2026.s3.ap-south-1.amazonaws.com/${album.s3_cover_key}` : "",
                    s3AudioKey: song.s3_audio_key,
                    albumId: album.id,
                    trackNumber: song.track_number
                  })}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 border cursor-pointer group ${isActive ? 'bg-black text-white shadow-md border-black' : 'border-transparent hover:border-gray-200 hover:bg-gray-50'}`}
                >
                  <span className={`w-6 text-center font-mono text-sm transition-colors ${isActive ? 'text-white' : 'text-gray-300 group-hover:text-black font-bold'}`}>
                    {isActive && isPlaying ? <div className="w-full flex justify-center"><Loader2 className="w-4 h-4 animate-spin" /></div> : song.track_number}
                  </span>
                  <span className={`flex-1 text-sm font-semibold transition-colors ${isActive ? 'text-white' : 'text-gray-800 group-hover:text-black'}`}>
                    {song.title}
                  </span>
                  <button className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isActive ? 'bg-white/20 text-white' : 'opacity-0 group-hover:opacity-100 bg-black text-white scale-90 group-hover:scale-100 shadow-sm'}`}>
                    <Play className="w-3 h-3 fill-current ml-0.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export const AlbumSongsNode = memo(AlbumSongsNodeComponent);
