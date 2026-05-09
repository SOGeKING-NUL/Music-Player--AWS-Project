import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useMusicPlayer, type TrackInfo } from "@/contexts/MusicPlayerContext";
import { X, Search, Loader2, Music, Play } from "lucide-react";
import { api } from "@/services/api";

export function QueueSidebar() {
  const { isQueueOpen, setIsQueueOpen, queue, currentTrack, playSong } = useMusicPlayer();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<TrackInfo[]>([]);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.searchMusic(searchQuery);
        const mapped: TrackInfo[] = res.data.results.map((q: any) => ({
          songId: q.song_id,
          title: q.title,
          artistName: q.artist_name,
          albumCoverUrl: q.albumCoverUrl || "",
          s3AudioKey: q.s3_audio_key,
          albumId: q.album_id,
          trackNumber: q.track_number
        }));
        setSearchResults(mapped);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <AnimatePresence>
      {isQueueOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-transparent z-[80]"
            onClick={() => setIsQueueOpen(false)}
          />
          <motion.div
            initial={{ x: "100%", opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0.5 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-[350px] bg-white/10 backdrop-blur-3xl shadow-[-10px_0_30px_rgba(0,0,0,0.1)] border-l border-white/30 z-[90] flex flex-col"
          >
            {/* Header & Search */}
            <div className="px-6 py-8 pb-4 shrink-0">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold tracking-tight text-black">Playing Next</h2>
                <button 
                  onClick={() => setIsQueueOpen(false)}
                  className="p-1.5 rounded-full hover:bg-black/5 transition-colors text-black/60 hover:text-black"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40" />
                <input 
                  type="text" 
                  placeholder="Query songs, albums, artists..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pr-4 pl-9 rounded-xl bg-black/5 border border-transparent focus:border-black/20 focus:bg-white/50 transition-all shadow-sm font-medium text-sm text-black placeholder:text-black/40 outline-none"
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-black/40" />
                )}
              </div>
            </div>

            {/* Track List */}
            <div className="flex-1 overflow-y-auto px-6 pb-24 custom-scrollbar">
              {searchQuery.trim() ? (
                // Search Results
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-black/40 mb-2">Search Results</h3>
                  {searchResults.length === 0 && !isSearching ? (
                    <p className="text-sm text-black/50 text-center py-4 font-medium">No results found.</p>
                  ) : (
                    searchResults.map(track => (
                      <TrackItem key={`search-${track.songId}`} track={track} onPlay={() => playSong(track)} />
                    ))
                  )}
                </div>
              ) : (
                // Queue
                <div className="space-y-4">
                  {currentTrack && (
                    <div className="space-y-2 mb-6">
                       <h3 className="text-xs font-bold uppercase tracking-widest text-black/40">Now Playing</h3>
                       <TrackItem track={currentTrack} isPlaying onPlay={() => {}} />
                    </div>
                  )}

                  <h3 className="text-xs font-bold uppercase tracking-widest text-black/40 mb-2 pt-2 border-t border-black/5">Up Next</h3>
                  {queue.length === 0 ? (
                    <p className="text-sm text-black/50 text-center py-4 font-medium">No upcoming tracks.</p>
                  ) : (
                    queue.map((track, idx) => (
                      <TrackItem key={`queue-${track.songId}-${idx}`} track={track} onPlay={() => playSong(track)} />
                    ))
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function TrackItem({ track, isPlaying, onPlay }: { track: TrackInfo, isPlaying?: boolean, onPlay: () => void }) {
  return (
    <div 
      onClick={onPlay}
      className={`flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200 cursor-pointer group ${isPlaying ? 'bg-black/5 shadow-sm' : 'hover:bg-white/50 border border-transparent hover:border-white'}`}
    >
      <div className="w-10 h-10 shrink-0 rounded-lg overflow-hidden bg-white shadow-sm flex items-center justify-center relative">
        {track.albumCoverUrl ? (
          <img src={track.albumCoverUrl} alt="cover" className="w-full h-full object-cover" />
        ) : (
          <Music className="w-4 h-4 text-black/30" />
        )}
        
        {!isPlaying && (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <Play className="w-4 h-4 text-white fill-current ml-0.5" />
          </div>
        )}
        {isPlaying && (
           <div className="absolute inset-0 bg-black/20 flex items-center justify-center transition-opacity">
             <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" /> {/* Simple spinner representing active */}
           </div>
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-center">
         <div className={`text-sm font-bold truncate ${isPlaying ? 'text-black' : 'text-black/80 group-hover:text-black'}`}>
           {track.title}
         </div>
         <div className="text-[10px] uppercase font-semibold tracking-wider text-black/50 truncate">
           {track.artistName}
         </div>
      </div>
    </div>
  );
}
