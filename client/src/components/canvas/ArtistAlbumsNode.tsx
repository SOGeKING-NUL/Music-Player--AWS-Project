import { useState, useEffect, memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { Input } from "@/components/ui/input";
import { api } from "@/services/api";
import { X, Plus, Disc3, Loader2 } from "lucide-react";

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

interface ArtistAlbumsNodeProps {
  id: string;
  data: {
    artist: Artist;
    onClose: (id: string) => void;
    onAlbumSelect: (album: Album) => void;
    selectedAlbumId?: string;
  };
}

function ArtistAlbumsNodeComponent({ id, data }: ArtistAlbumsNodeProps) {
  const { artist } = data;
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingAlbum, setIsAddingAlbum] = useState(false);
  const [newAlbumTitle, setNewAlbumTitle] = useState("");
  const [newAlbumYear, setNewAlbumYear] = useState<number | "">("");

  const fetchAlbums = async () => {
    try {
      setIsLoading(true);
      const res = await api.getArtistAlbums(artist.id);
      setAlbums(res.data.albums || []);
    } catch (err) {
      console.error("Failed to fetch albums", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlbums();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artist.id]);

  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlbumTitle.trim()) return;

    try {
      setIsLoading(true);
      await api.addAlbum({
        title: newAlbumTitle,
        artistId: artist.id,
        releaseYear: newAlbumYear ? Number(newAlbumYear) : undefined
      });
      setNewAlbumTitle("");
      setNewAlbumYear("");
      setIsAddingAlbum(false);
      fetchAlbums();
    } catch (err) {
      console.error("Failed to create album", err);
      setIsLoading(false);
    }
  };

  return (
    <div className="w-[420px] bg-white border border-gray-200 rounded-3xl shadow-xl overflow-hidden transition-all duration-300 animate-in fade-in zoom-in-95">
      {/* Left Handle: Connects from Artist Bubble */}
      <Handle type="target" position={Position.Left} className="!w-4 !h-4 !bg-black !border-[3px] !border-black" />
      {/* Right Handle: Connects to Album Songs Node */}
      <Handle type="source" position={Position.Right} className="!w-4 !h-4 !bg-black !border-[3px] !border-black" />

      <div className="flex flex-row items-center justify-between p-5 border-b border-gray-100 bg-gray-50/30 w-full">
        <div className="flex flex-row items-center gap-4">
          <img src={artist.image} alt={artist.name} className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm" draggable={false} />
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Artist Albums</span>
            <h3 className="text-xl font-bold leading-tight truncate w-36">{artist.name}</h3>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsAddingAlbum(!isAddingAlbum)}
            className="bg-black text-white px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-gray-800 transition-colors flex items-center gap-1 nodrag"
          >
            <Plus className="w-3 h-3" /> New Album
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
        {isAddingAlbum && (
          <form onSubmit={handleCreateAlbum} className="mb-4 bg-gray-50 p-4 rounded-xl border border-gray-200 animate-in fade-in slide-in-from-top-4">
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
              <button type="button" onClick={() => setIsAddingAlbum(false)} className="text-xs font-medium text-gray-500 hover:text-black px-3 py-2 transition-colors">Cancel</button>
              <button type="submit" className="text-xs font-bold bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors shadow-sm opacity-100 disabled:opacity-50">
                Save Album
              </button>
            </div>
          </form>
        )}

        <div className="space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-gray-300" /></div>
          ) : albums.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">No albums available. Create one to get started.</div>
          ) : (
            albums.map((album) => {
              const isActive = data.selectedAlbumId === album.id;
              return (
                <div 
                  key={album.id} 
                  onClick={() => data.onAlbumSelect(album)}
                  className={`flex flex-row items-center gap-4 p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                    isActive 
                      ? "border-black bg-gray-50 shadow-sm" 
                      : "border-gray-200/60 bg-white hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm"
                  }`}
                >
                  <div className={`w-12 h-12 flex items-center justify-center rounded-lg border transition-colors ${isActive ? 'bg-black border-black shadow-md' : 'bg-gray-50 border-gray-100 shadow-sm'}`}>
                    <Disc3 className={`w-6 h-6 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <h4 className={`font-bold ${isActive ? 'text-black' : 'text-gray-800'}`}>{album.title}</h4>
                    <p className="text-xs text-gray-500 font-medium">{album.release_year || 'Unknown Year'}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export const ArtistAlbumsNode = memo(ArtistAlbumsNodeComponent);
