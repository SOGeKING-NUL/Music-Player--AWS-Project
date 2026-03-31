import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

export const api = {
  // Artists
  getArtists: () => axios.get(`${API_BASE}/music/artists`),
  addArtist: (data: { name: string; s3CoverKey?: string }) => 
    axios.post(`${API_BASE}/music/artist`, data),
  
  // Upload
  getArtistImagePresignedUrl: (artistId: string, fileType: string) =>
    axios.post(`${API_BASE}/upload/artist/presigned-url`, { artistId, fileType }),
};

export const uploadToS3 = async (presignedUrl: string, file: File) => {
  await axios.put(presignedUrl, file, {
    headers: {
      'Content-Type': file.type,
    },
  });
};
