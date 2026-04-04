import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Disc3, Plus, Music, Loader2, Upload } from "lucide-react";
import { api, uploadToS3 } from "@/services/api";

interface Artist {
  id: string;
  name: string;
  image: string;
}

interface Album {
  id: string;
  title: string;
  release_year?: number;
}

interface Song {
  id: string;
  title: string;
  track_number: number;
  duration_seconds?: number;
}

interface ArtistDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  artist: Artist | null;
}

function AlbumItem({ album, artistId }: { album: Album; artistId: string }) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [isAddingTrack, setIsAddingTrack] = useState(false);
  const [trackTitle, setTrackTitle] = useState("");
  const [trackNumber, setTrackNumber] = useState(1);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fetchSongs = async () => {
    try {
      const { data } = await api.getAlbumSongs(album.id);
      // Assuming returned data is { songs: [...] } or array, sort by track_number
      const fetchedSongs = data.songs || [];
      setSongs(fetchedSongs.sort((a: Song, b: Song) => a.track_number - b.track_number));
      if (fetchedSongs.length > 0) {
        setTrackNumber(Math.max(...fetchedSongs.map((s: Song) => s.track_number)) + 1);
      }
    } catch (err) {
      console.error("Failed to fetch songs for album", album.id, err);
    }
  };

  useEffect(() => {
    fetchSongs();
  }, [album.id]);

  const handleAddTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackTitle.trim() || !audioFile) return;

    try {
      setIsUploading(true);
      // 1. Get Presigned URL
      const songId = crypto.randomUUID();
      const { data: presignedData } = await api.getSongPresignedUrl({
        artistId: artistId,
        albumId: album.id,
        songId,
        trackNumber: trackNumber,
        fileType: audioFile.type,
      });
      
      // 2. Upload to S3
      await uploadToS3(presignedData.uploadUrl, audioFile);
      
      // 3. Confirm in DB
      await api.confirmSongUpload({
        albumId: album.id,
        artistId: artistId,
        title: trackTitle,
        trackNumber: trackNumber,
        s3AudioKey: presignedData.key || presignedData.s3Key // fallback just in case
      });

      // Cleanup & Refresh
      setTrackTitle("");
      setAudioFile(null);
      setIsAddingTrack(false);
      fetchSongs();
    } catch (err) {
      console.error("Failed to add track:", err);
      // Ideally show a toast error here
    } finally {
      setIsUploading(false);
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-gray-50/50 rounded-xl border border-gray-200/60 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white shadow-sm flex items-center justify-center rounded-lg border border-gray-100">
            <Disc3 className="w-5 h-5 text-gray-400" />
          </div>
          <div>
            <h4 className="font-semibold text-lg">{album.title}</h4>
            <p className="text-xs text-gray-500 font-medium">{album.release_year || 'Unknown Year'} • {songs.length} Tracks</p>
          </div>
        </div>
        <button 
          onClick={() => setIsAddingTrack(!isAddingTrack)}
          className="text-xs font-semibold text-gray-600 bg-white border border-gray-200 px-3 py-1.5 rounded-full hover:bg-gray-50 flex items-center gap-1"
        >
          <Plus className="w-3 h-3" /> Add Track
        </button>
      </div>

      {isAddingTrack && (
        <form onSubmit={handleAddTrack} className="mb-4 bg-white p-3 rounded-lg border border-gray-200 shadow-sm text-sm space-y-3">
          <div className="grid grid-cols-[60px_1fr] gap-2">
            <Input 
              type="number" 
              min="1"
              value={trackNumber} 
              onChange={e => setTrackNumber(Number(e.target.value))} 
              placeholder="#" 
              required 
              className="text-center"
            />
            <Input 
              placeholder="Track Title" 
              value={trackTitle} 
              onChange={e => setTrackTitle(e.target.value)} 
              required 
            />
          </div>
          <div className="flex items-center gap-2">
            <Input 
              type="file" 
              accept="audio/*"
              onChange={e => setAudioFile(e.target.files?.[0] || null)} 
              required 
              className="flex-1 text-xs"
            />
            <button 
              type="submit" 
              disabled={isUploading || !audioFile || !trackTitle}
              className="bg-black text-white px-4 py-2 rounded-md font-medium text-xs disabled:opacity-50 flex items-center gap-1"
            >
              {isUploading ? <Loader2 className="w-3 h-3 animate-spin"/> : <Upload className="w-3 h-3"/>}
              Upload
            </button>
          </div>
        </form>
      )}

      <div className="space-y-1">
        {songs.length === 0 && !isAddingTrack && (
          <p className="text-xs text-gray-400 text-center py-2">No tracks in this album yet.</p>
        )}
        {songs.map((song) => (
          <div key={song.id || song.track_number} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white hover:shadow-sm transition-all duration-200 cursor-pointer border border-transparent hover:border-gray-100 group">
            <span className="text-xs font-bold text-gray-300 w-4 text-right group-hover:text-[rgb(255,100,150)] transition-colors">{song.track_number}</span>
            <span className="flex-1 text-sm font-medium">{song.title}</span>
            <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"><Music className="w-3 h-3 inline mr-1"/></span>
            <span className="text-xs text-gray-400">{formatDuration(song.duration_seconds)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ArtistDetailsModal({ open, onOpenChange, artist }: ArtistDetailsModalProps) {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingAlbum, setIsAddingAlbum] = useState(false);
  
  // New Album Form State
  const [newAlbumTitle, setNewAlbumTitle] = useState("");
  const [newAlbumYear, setNewAlbumYear] = useState<number | "">("");

  const fetchAlbums = async () => {
    if (!artist) return;
    try {
      setIsLoading(true);
      const { data } = await api.getArtistAlbums(artist.id);
      setAlbums(data.albums || []);
    } catch (err) {
      console.error("Failed to fetch albums", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchAlbums();
      setIsAddingAlbum(false);
    }
  }, [open, artist]);

  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artist || !newAlbumTitle.trim()) return;

    try {
      // Generate album ID in frontend - this will be used for both S3 and database
      const albumId = crypto.randomUUID();
      await api.addAlbum({
        id: albumId,
        title: newAlbumTitle,
        artistId: artist.id,
        releaseYear: newAlbumYear ? Number(newAlbumYear) : undefined
      });
      setNewAlbumTitle("");
      setNewAlbumYear("");
      setIsAddingAlbum(false);
      fetchAlbums(); // refresh list
    } catch (err) {
      console.error("Failed to create album", err);
    }
  };

  if (!artist) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex flex-row items-center gap-4">
            <img src={artist.image} alt={artist.name} className="w-16 h-16 rounded-full object-cover border-2 border-gray-100 shadow-sm" />
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Artist Profile</span>
              <DialogTitle className="text-2xl font-bold">{artist.name}</DialogTitle>
            </div>
          </div>
          <button 
            onClick={() => setIsAddingAlbum(!isAddingAlbum)}
            className="bg-black text-white px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-gray-800 transition-colors flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> New Album
          </button>
        </DialogHeader>

        {isAddingAlbum && (
          <form onSubmit={handleCreateAlbum} className="mt-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
            <h4 className="text-sm font-bold mb-3">Create New Album</h4>
            <div className="flex gap-2 mb-3">
              <Input 
                placeholder="Album Title" 
                value={newAlbumTitle} 
                onChange={e => setNewAlbumTitle(e.target.value)} 
                required 
                className="flex-1 bg-white"
              />
              <Input 
                type="number" 
                placeholder="Year" 
                value={newAlbumYear} 
                onChange={e => setNewAlbumYear(Number(e.target.value) || "")} 
                className="w-24 bg-white"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setIsAddingAlbum(false)} className="text-xs font-medium text-gray-500 hover:text-black px-3 py-2">Cancel</button>
              <button type="submit" className="text-xs font-bold bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800">Save Album</button>
            </div>
          </form>
        )}

        <div className="mt-4 space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-gray-300" /></div>
          ) : albums.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">No albums available for this artist.</div>
          ) : (
            albums.map((album) => (
              <AlbumItem key={album.id} album={album} artistId={artist.id} />
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
