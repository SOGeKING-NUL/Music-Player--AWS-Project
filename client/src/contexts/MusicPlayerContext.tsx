import { createContext, useContext, useState, useRef, useEffect, useCallback, type ReactNode } from 'react';
import { api } from '@/services/api';

export interface TrackInfo {
  songId: string;
  title: string;
  artistName: string;
  albumCoverUrl: string;
  s3AudioKey: string;
  albumId?: string;
  trackNumber?: number;
}

interface MusicPlayerContextType {
  currentTrack: TrackInfo | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  volume: number;
  queue: TrackInfo[];
  isQueueOpen: boolean;
  setIsQueueOpen: (v: boolean) => void;
  playSong: (track: TrackInfo) => void;
  playNext: () => void;
  playPrevious: () => void;
  togglePlayPause: () => void;
  seek: (value: number) => void;
  setVolumeLevel: (value: number) => void;
}

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(undefined);

export const MusicPlayerProvider = ({ children }: { children: ReactNode }) => {
  const [currentTrack, setCurrentTrack] = useState<TrackInfo | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [queue, setQueue] = useState<TrackInfo[]>([]);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Refs so stale-closure event listeners always read fresh values
  const queueRef = useRef<TrackInfo[]>([]);
  const currentTrackRef = useRef<TrackInfo | null>(null);
  const progressRef = useRef(0);

  useEffect(() => { queueRef.current = queue; }, [queue]);
  useEffect(() => { currentTrackRef.current = currentTrack; }, [currentTrack]);
  useEffect(() => { progressRef.current = progress; }, [progress]);

  // ── Audio element bootstrap ──────────────────────────────────────────────
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    const audio = audioRef.current;

    const handleTimeUpdate = () => setProgress(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => playNextRef.current();
    const handlePause = () => setIsPlaying(false);
    const handlePlay = () => setIsPlaying(true);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('play', handlePlay);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('play', handlePlay);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Session init + last-played restore ──────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        await api.initSession();
        const { data } = await api.getLastPlayed();
        if (data.track) {
          // Restore the track in the dock (no auto-play)
          setCurrentTrack({
            songId: data.track.songId,
            title: data.track.title,
            artistName: data.track.artistName,
            albumCoverUrl: data.track.albumCoverUrl,
            s3AudioKey: data.track.s3AudioKey,
            albumId: data.track.albumId,
            trackNumber: data.track.trackNumber,
          });
          // Restore seek position so user sees where they left off
          setProgress(data.track.progressSeconds ?? 0);
          setDuration(0); // duration unknown until audio loads
        }
      } catch (err) {
        console.warn('Session init failed (non-fatal):', err);
      }
    };
    init();
  }, []);

  // ── Internal play (stream + play audio) ─────────────────────────────────
  const _internalPlay = useCallback(async (track: TrackInfo) => {
    if (!audioRef.current) return;
    setCurrentTrack(track);
    setIsPlaying(false);
    setProgress(0);
    setDuration(0);

    try {
      const { data } = await api.getSongStreamUrl(track.s3AudioKey);
      audioRef.current.src = data.streamUrl;
      audioRef.current.load();
      await audioRef.current.play();
      setIsPlaying(true);

      // Log to backend (fire-and-forget)
      api.logPlay(track.songId, 0).catch(() => {});
    } catch (err) {
      console.error('Failed to stream song:', err);
      setIsPlaying(false);
    }
  }, []);

  // ── playNext ─────────────────────────────────────────────────────────────
  const playNext = useCallback(async () => {
    if (queueRef.current.length > 0) {
      const nextTrack = queueRef.current[0];
      setQueue(prev => prev.slice(1));
      await _internalPlay(nextTrack);
    } else {
      setIsPlaying(false);
      setProgress(0);
    }
  }, [_internalPlay]);

  // Keep a stable ref so the 'ended' event listener can always call the latest version
  const playNextRef = useRef(playNext);
  useEffect(() => { playNextRef.current = playNext; }, [playNext]);

  // ── playPrevious ─────────────────────────────────────────────────────────
  // Spotify/Apple Music behaviour:
  //   - If more than 3 seconds in → restart current track
  //   - If within first 3 seconds → go to previous song in DB history
  const playPrevious = useCallback(async () => {
    const currentProgress = progressRef.current;
    const track = currentTrackRef.current;

    if (currentProgress > 3 && audioRef.current) {
      // Just restart
      audioRef.current.currentTime = 0;
      setProgress(0);
      return;
    }

    if (!track) return;

    try {
      const { data } = await api.getPreviousTrack(track.songId);
      if (data.track) {
        await _internalPlay({
          songId: data.track.songId,
          title: data.track.title,
          artistName: data.track.artistName,
          albumCoverUrl: data.track.albumCoverUrl,
          s3AudioKey: data.track.s3AudioKey,
          albumId: data.track.albumId,
          trackNumber: data.track.trackNumber,
        });
      } else {
        // No previous track in history — just restart current
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          setProgress(0);
        }
      }
    } catch (err) {
      console.error('Failed to get previous track:', err);
    }
  }, [_internalPlay]);

  // ── playSong (user-initiated) ─────────────────────────────────────────────
  const playSong = useCallback(async (track: TrackInfo) => {
    if (!audioRef.current) return;

    if (currentTrackRef.current?.songId === track.songId) {
      togglePlayPause();
      return;
    }

    await _internalPlay(track);

    // Fetch the up-next queue from backend
    try {
      const { data } = await api.getQueue({ albumId: track.albumId, trackNumber: track.trackNumber });
      const nextTracks: TrackInfo[] = data.queue.map((q: any) => ({
        songId: q.song_id,
        title: q.title,
        artistName: q.artist_name,
        albumCoverUrl: q.albumCoverUrl || '',
        s3AudioKey: q.s3_audio_key,
        albumId: q.album_id,
        trackNumber: q.track_number,
      }));
      setQueue(nextTracks);
    } catch (err) {
      console.error('Failed to fetch queue', err);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_internalPlay]);

  // ── Controls ──────────────────────────────────────────────────────────────
  const togglePlayPause = useCallback(() => {
    if (!audioRef.current || !currentTrackRef.current) return;
    if (audioRef.current.paused) {
      audioRef.current.play();
    } else {
      audioRef.current.pause();
    }
  }, []);

  const seek = useCallback((value: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = value;
    setProgress(value);
  }, []);

  const setVolumeLevel = useCallback((value: number) => {
    if (!audioRef.current) return;
    const clamped = Math.max(0, Math.min(1, value));
    audioRef.current.volume = clamped;
    setVolume(clamped);
  }, []);

  return (
    <MusicPlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        progress,
        duration,
        volume,
        queue,
        isQueueOpen,
        setIsQueueOpen,
        playSong,
        playNext,
        playPrevious,
        togglePlayPause,
        seek,
        setVolumeLevel,
      }}
    >
      {children}
    </MusicPlayerContext.Provider>
  );
};

export const useMusicPlayer = () => {
  const context = useContext(MusicPlayerContext);
  if (!context) {
    throw new Error('useMusicPlayer must be used within a MusicPlayerProvider');
  }
  return context;
};
