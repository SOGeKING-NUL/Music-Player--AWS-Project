import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Disc3 } from "lucide-react";

interface ArtistDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  artist: { id: string; name: string; image: string } | null;
}

const MOCK_ALBUMS = [
  {
    id: 'a1',
    title: 'After Hours',
    year: 2020,
    songs: [
      { track: 1, title: 'Blinding Lights', duration: '3:20' },
      { track: 2, title: 'Save Your Tears', duration: '3:35' },
    ]
  },
  {
    id: 'a2',
    title: 'Starboy',
    year: 2016,
    songs: [
      { track: 1, title: 'Starboy', duration: '3:50' },
      { track: 2, title: 'I Feel It Coming', duration: '4:29' },
    ]
  }
];

export function ArtistDetailsModal({ open, onOpenChange, artist }: ArtistDetailsModalProps) {
  if (!artist) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="flex flex-row items-center gap-4 border-b border-gray-100 pb-4">
          <img src={artist.image} alt={artist.name} className="w-16 h-16 rounded-full object-cover border-2 border-gray-100 shadow-sm" />
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Artist Profile</span>
            <DialogTitle className="text-2xl font-bold">{artist.name}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="mt-4 space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          {MOCK_ALBUMS.map((album) => (
            <div key={album.id} className="bg-gray-50/50 rounded-xl border border-gray-200/60 p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white shadow-sm flex items-center justify-center rounded-lg border border-gray-100">
                  <Disc3 className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg">{album.title}</h4>
                  <p className="text-xs text-gray-500 font-medium">{album.year} • {album.songs.length} Tracks</p>
                </div>
              </div>

              <div className="space-y-1">
                {album.songs.map((song) => (
                  <div key={song.track} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white hover:shadow-sm transition-all duration-200 cursor-pointer border border-transparent hover:border-gray-100 group">
                    <span className="text-xs font-bold text-gray-300 w-4 text-right group-hover:text-[rgb(255,100,150)] transition-colors">{song.track}</span>
                    <span className="flex-1 text-sm font-medium">{song.title}</span>
                    <span className="text-xs text-gray-400">{song.duration}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
