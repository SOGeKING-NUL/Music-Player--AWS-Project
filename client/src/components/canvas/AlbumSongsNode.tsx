import { useState, useEffect, memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { Input } from "@/components/ui/input";
import { api, uploadToS3 } from "@/services/api";
import { X, Plus, Music, Loader2, Upload } from "lucide-react";

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
  const { album, artistId } = data;
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingTrack, setIsAddingTrack] = useState(false);
  const [trackTitle, setTrackTitle] = useState("");
  const [trackNumber, setTrackNumber] = useState(1);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSongs = async () => {
    try {
      setIsLoading(true);
      const res = await api.getAlbumSongs(album.id);
      const fetchedSongs = res.data.songs || [];
      setSongs(fetchedSongs.sort((a: Song, b: Song) => a.track_number - b.track_number));
      if (fetchedSongs.length > 0) {
        setTrackNumber(Math.max(...fetchedSongs.map((s: Song) => s.track_number)) + 1);
      } else {
        setTrackNumber(1);
      }
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

  const handleAddTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackTitle.trim() || !audioFile) return;

    try {
      setIsUploading(true);
      setError(null);
      // 1. Get Presigned URL
      const { data: presignedData } = await api.getSongPresignedUrl(audioFile.name, audioFile.type);
      
      // 2. Upload to S3
      await uploadToS3(presignedData.uploadUrl, audioFile);
      
      // 3. Confirm in DB
      await api.confirmSongUpload({
        albumId: album.id,
        artistId: artistId,
        title: trackTitle,
        trackNumber: trackNumber,
        s3AudioKey: presignedData.key || presignedData.s3Key
      });

      // Cleanup & Refresh
      setTrackTitle("");
      setAudioFile(null);
      setIsAddingTrack(false);
      fetchSongs();
    } catch (err: any) {
      console.error("Failed to add track:", err);
      setError(err.message || "Failed to upload track.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-[420px] bg-white border border-gray-200 rounded-3xl shadow-xl overflow-hidden transition-all duration-300 animate-in fade-in zoom-in-95">
      {/* Left Handle: Connects from Album Node */}
      <Handle type="target" position={Position.Left} className="!w-4 !h-4 !bg-black !border-[3px] !border-black" />

      <div className="flex flex-row items-center justify-between p-5 border-b border-gray-100 bg-gray-50/30 w-full">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Album Tracks</span>
          <h3 className="text-xl font-bold leading-tight truncate w-48">{album.title}</h3>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsAddingTrack(!isAddingTrack)}
            className="bg-black text-white px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-gray-800 transition-colors flex items-center gap-1 nodrag"
          >
            <Plus className="w-3 h-3" /> Add Track
          </button>
          <button 
            onClick={() => data.onClose(id)}
            className="p-1.5 rounded-full bg-white border border-gray-200 hover:bg-gray-100 transition-colors text-gray-500 hover:text-black nodrag"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-5 max-h-[400px] overflow-y-auto custom-scrollbar nodrag">
        {isAddingTrack && (
          <form onSubmit={handleAddTrack} className="mb-4 bg-gray-50 p-4 rounded-xl border border-gray-200 shadow-sm text-sm space-y-3 animate-in fade-in slide-in-from-top-4">
            <h4 className="text-sm font-bold">Upload New Track</h4>
            <div className="grid grid-cols-[60px_1fr] gap-2">
              <Input 
                type="number" 
                min="1"
                value={trackNumber} 
                onChange={e => setTrackNumber(Number(e.target.value))} 
                placeholder="#" 
                required 
                className="text-center bg-white"
              />
              <Input 
                placeholder="Track Title" 
                value={trackTitle} 
                onChange={e => setTrackTitle(e.target.value)} 
                required 
                className="bg-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input 
                  type="file" 
                  accept="audio/*"
                  onChange={e => setAudioFile(e.target.files?.[0] || null)} 
                  required 
                  className="bg-white w-full pr-0 cursor-pointer"
                />
              </div>
              <button 
                type="submit" 
                disabled={isUploading || !audioFile || !trackTitle}
                className="bg-black text-white px-4 h-10 rounded-md font-bold text-xs disabled:opacity-50 flex items-center gap-1 min-w-[90px] justify-center transition-all hover:bg-gray-800"
              >
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin"/> : <><Upload className="w-3 h-3"/> Upload</>}
              </button>
            </div>
            {error && <p className="text-red-500 text-xs font-medium px-2 py-1 bg-red-50 rounded border border-red-100">{error}</p>}
          </form>
        )}

        <div className="space-y-1">
          {isLoading ? (
             <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-gray-300" /></div>
          ) : songs.length === 0 && !isAddingTrack ? (
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
