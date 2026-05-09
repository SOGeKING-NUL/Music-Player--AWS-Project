import { FloatingDock } from "@/components/ui/floating-dock";
import { IconArrowsShuffle, IconRepeat, IconList } from "@tabler/icons-react";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { Play, Pause, SkipBack, SkipForward, Music } from "lucide-react";
import { useEffect, useState } from "react";

export function GlobalMusicDock() {
  const { currentTrack, isPlaying, progress, duration, togglePlayPause, seek, isQueueOpen, setIsQueueOpen, playNext, playPrevious } = useMusicPlayer();
  const [localProgress, setLocalProgress] = useState(progress);

  useEffect(() => {
    setLocalProgress(progress);
  }, [progress]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault(); // Prevent scrolling down the page
        togglePlayPause();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlayPause]);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    seek(percent * duration);
  };

  // Convert Home/Search to Shuffle/Repeat within the animated dock context
  const navItems = [
    {
      title: "Shuffle",
      icon: <IconArrowsShuffle className="h-full w-full" />,
      onClick: () => console.log("Shuffle clicked"),
    },
    {
      title: "Repeat",
      icon: <IconRepeat className="h-full w-full" />,
      onClick: () => console.log("Repeat clicked"),
    },
    {
      title: "Playing Next",
      icon: <IconList className="h-full w-full" />,
      onClick: () => setIsQueueOpen(!isQueueOpen),
    },
  ];

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex items-center">
      <FloatingDock items={navItems}>
        {/* Integrated Music Player Section inside Dock */}
        {currentTrack ? (
          <div className="flex items-center gap-4 px-2 h-full w-[400px]">
            {/* Album Cover */}
            <div className="h-12 w-12 shrink-0 rounded-xl overflow-hidden shadow-sm border border-black/5 bg-gray-100 flex items-center justify-center">
              {currentTrack.albumCoverUrl ? (
                <img 
                  src={currentTrack.albumCoverUrl} 
                  alt="cover" 
                  className="h-full w-full object-cover"
                />
              ) : (
                <Music className="w-5 h-5 text-gray-400" />
              )}
            </div>
            
            {/* Track Info & Progress */}
            <div className="flex flex-col justify-center flex-1 min-w-0 pr-2">
              <div className="text-sm font-bold truncate text-black">{currentTrack.title}</div>
              <div className="text-[10px] uppercase font-semibold tracking-wider text-black/50 truncate">
                {currentTrack.artistName}
              </div>
              
              {/* Scrub Bar */}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[9px] font-mono font-medium text-black/40 w-6 text-right shrink-0">
                  {formatTime(localProgress)}
                </span>
                <div 
                  className="flex-1 h-1.5 bg-black/10 rounded-full cursor-pointer relative overflow-hidden shrink-0 transition-opacity hover:opacity-80"
                  onClick={handleProgressBarClick}
                >
                  <div 
                    className="absolute top-0 left-0 h-full bg-black rounded-full transition-all duration-100 ease-linear" 
                    style={{ width: `${duration ? (localProgress / duration) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-[9px] font-mono font-medium text-black/40 w-6 shrink-0">
                  {formatTime(duration)}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3 shrink-0 px-2">
              <button 
                onClick={playPrevious}
                className="w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300 ease-out transform hover:scale-[1.25] hover:bg-black hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] text-black/70 hover:text-white active:scale-95"
              >
                <SkipBack className="w-4 h-4 fill-current" />
              </button>
              <button 
                onClick={togglePlayPause}
                style={{ transformOrigin: "center" }}
                className="w-10 h-10 flex flex-shrink-0 items-center justify-center rounded-full bg-black text-white hover:bg-neutral-800 transition-all duration-300 ease-out transform hover:scale-[1.25] hover:shadow-[0_8px_20px_rgba(0,0,0,0.4)] hover:ring-4 ring-black/10 active:scale-95"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </button>
              <button 
                onClick={() => playNext()}
                className="w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300 ease-out transform hover:scale-[1.25] hover:bg-black hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] text-black/70 hover:text-white active:scale-95"
              >
                <SkipForward className="w-4 h-4 fill-current" />
              </button>
            </div>
          </div>
        ) : (
          <div className="px-6 text-xs font-semibold text-black/40 uppercase tracking-widest flex items-center h-full min-w-[300px] justify-center">
            Ready to Play
          </div>
        )}
      </FloatingDock>
    </div>
  );
}
