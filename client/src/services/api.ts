import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000/api';

// Single axios instance — sends cookies automatically on every request
const http = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

export const api = {
  // Artists
  getArtists: () => http.get('/music/artists'),
  addArtist: (data: { id: string; name: string; s3CoverKey?: string }) =>
    http.post('/music/artist', data),

  // Albums
  getArtistAlbums: (artistId: string) => http.get(`/music/artist/${artistId}/albums`),
  addAlbum: (data: { id: string; title: string; artistId: string; releaseYear?: number; genre?: string }) =>
    http.post('/music/album', data),

  // Songs
  getAlbumSongs: (albumId: string) => http.get(`/music/album/${albumId}/songs`),
  confirmSongUpload: (data: { albumId: string; artistId: string; title: string; trackNumber: number; durationSeconds?: number; s3AudioKey: string }) =>
    http.post('/upload/song/confirm', data),

  // Upload Presigned URLs
  getArtistImagePresignedUrl: (artistId: string, fileType: string) =>
    http.post('/upload/artist/presigned-url', { artistId, fileType }),
  getSongPresignedUrl: (data: {
    artistId: string;
    albumId: string;
    songId: string;
    trackNumber: number;
    fileType: string;
  }) =>
    http.post('/upload/song/presigned-url', data),
  getAlbumCoverPresignedUrl: (artistId: string, albumId: string, fileType: string) =>
    http.post('/upload/cover/presigned-url', { artistId, albumId, fileType }),
  confirmAlbumCoverUpload: (artistId: string, albumId: string, s3CoverKey: string) =>
    http.post('/upload/cover/confirm', { artistId, albumId, s3CoverKey }),
  getSongStreamUrl: (s3AudioKey: string) =>
    http.post('/upload/stream/url', { s3AudioKey }),

  // Queue & Search
  getQueue: (params?: { albumId?: string; trackNumber?: number; limit?: number }) =>
    http.get('/music/queue', { params }),
  searchMusic: (q: string, limit: number = 20) =>
    http.get('/music/search', { params: { q, limit } }),

  // Session
  initSession: () => http.post('/session/init'),
  logPlay: (songId: string, progressSeconds = 0) =>
    http.post('/session/history', { songId, progressSeconds }),
  getLastPlayed: () => http.get('/session/last-played'),
  getPreviousTrack: (currentSongId: string) =>
    http.get('/session/previous', { params: { currentSongId } }),
};

export const uploadToS3 = async (presignedUrl: string, file: File) => {
  // S3 presigned PUT — NOT through our api instance (no credentials needed, different host)
  await axios.put(presignedUrl, file, {
    headers: { 'Content-Type': file.type },
  });
};
