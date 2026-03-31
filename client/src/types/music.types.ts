export interface Artist {
  id: string;
  name: string;
  s3_cover_key?: string;
  created_at: string;
}

export interface Album {
  id: string;
  title: string;
  artist_id: string;
  release_year?: number;
  genre?: string;
  s3_cover_key?: string;
  created_at: string;
}

export interface Song {
  id: string;
  title: string;
  artist_id: string;
  album_id: string;
  track_number: number;
  duration_seconds?: number;
  s3_audio_key: string;
  created_at: string;
}

export interface PresignedUrlResponse {
  uploadUrl: string;
  s3Key: string;
  expiresIn: number;
}
