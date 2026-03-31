import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000/api';

export const api = {
  // Artists
  getArtists: () => axios.get(`${API_BASE}/music/artists`),
  addArtist: (data: { name: string; s3CoverKey?: string }) => 
    axios.post(`${API_BASE}/music/artist`, data),
  
  // Albums
  getArtistAlbums: (artistId: string) => axios.get(`${API_BASE}/music/artist/${artistId}/albums`),
  addAlbum: (data: { title: string; artistId: string; releaseYear?: number; genre?: string }) => 
    axios.post(`${API_BASE}/music/album`, data),

  // Songs
  getAlbumSongs: (albumId: string) => axios.get(`${API_BASE}/music/album/${albumId}/songs`),
  // The actual song file is confirmed via upload endpoint
  confirmSongUpload: (data: { albumId: string; artistId: string; title: string; trackNumber: number; durationSeconds?: number; s3AudioKey: string }) =>
    axios.post(`${API_BASE}/upload/song/confirm`, data),

  // Upload Presigned URLs
  getArtistImagePresignedUrl: (artistId: string, fileType: string) =>
    axios.post(`${API_BASE}/upload/artist/presigned-url`, { artistId, fileType }),
  getSongPresignedUrl: (fileName: string, fileType: string) =>
    axios.post(`${API_BASE}/upload/song/presigned-url`, { fileName, fileType }),
};

export const uploadToS3 = async (presignedUrl: string, file: File) => {
  await axios.put(presignedUrl, file, {
    headers: {
      'Content-Type': file.type,
    },
  });
};
