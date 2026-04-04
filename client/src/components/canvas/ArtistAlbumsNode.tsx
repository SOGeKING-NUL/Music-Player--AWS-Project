import { useState, useEffect, memo } from "react";
import { Handle, Position } from "@xyflow/react";
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
  genre?: string;
  s3_cover_key?: string;
}

interface ArtistAlbumsNodeProps {
  id: string;
  data: {
    artist: Artist;
    onClose: (id: string) => void;
    onAlbumSelect: (album: Album) => void;
    onNewAlbumClick: () => void;
    selectedAlbumId?: string;
    refreshKey?: number;
  };
}

function ArtistAlbumsNodeComponent({ id, data }: ArtistAlbumsNodeProps) {
  const { artist, refreshKey, onNewAlbumClick } = data;
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
  }, [artist.id, refreshKey]);

  return (
    <div className="w-[420px] bg-white border border-gray-200 rounded-3xl shadow-xl overflow-hidden transition-all duration-300 animate-in fade-in zoom-in-95">
      {/* Left Handle: Connects from Artist Bubble */}
      <Handle type="target" position={Position.Left} className="!w-4 !h-4 !bg-black !border-[3px] !border-black" />
      {/* Right Handle: Connects to Album Songs Node */}
      <Handle type="source" position={Position.Right} className="!w-4 !h-4 !bg-black !border-[3px] !border-black" />

      <div className="flex flex-row items-center justify-between p-6 pb-2 w-full relative z-10">
        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Albums</span>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => onNewAlbumClick()}
            className="w-7 h-7 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors shadow-sm nodrag title"
            title="New Album"
          >
            <Plus className="w-4 h-4" />
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
        <div className="grid grid-cols-3 gap-4">
          {isLoading ? (
            <div className="col-span-3 flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-gray-300" /></div>
          ) : albums.length === 0 ? (
            <div className="col-span-3 text-center py-8 text-gray-400 text-sm">No albums available. Create one to get started.</div>
          ) : (
            albums.map((album) => {
              const isActive = data.selectedAlbumId === album.id;
              return (
                <div 
                  key={album.id} 
                  onClick={() => data.onAlbumSelect(album)}
                  className={`flex flex-col items-start gap-2 transition-all duration-200 cursor-pointer group ${
                    isActive ? "scale-105" : "hover:scale-105"
                  }`}
                >
                  <div className={`w-full aspect-square flex items-center justify-center rounded-lg overflow-hidden relative bg-gray-50 ${isActive ? 'ring-2 ring-black ring-offset-2' : 'shadow-sm group-hover:shadow-md'}`}>
                    {album.s3_cover_key ? (
                      <img src={`https://music-player-2026.s3.ap-south-1.amazonaws.com/${album.s3_cover_key}`} className="w-full h-full object-cover" alt={album.title} />
                    ) : (
                      <Disc3 className={`w-8 h-8 ${isActive ? 'text-black' : 'text-gray-400'}`} />
                    )}
                  </div>
                  <div className="text-center w-full">
                    <h4 className={`font-bold text-sm truncate ${isActive ? 'text-black' : 'text-gray-800'}`} title={album.title}>{album.title}</h4>
                    <p className="text-[10px] text-gray-500 font-medium truncate mt-0.5">
                      {album.release_year || 'Unknown Year'}{album.genre ? ` • ${album.genre}` : ''}
                    </p>
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
