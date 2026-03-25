export function generateSongKey(
    artistId: string,
    albumId: string,
    songId: string,
    extension: string = '.flac'
) : string {
    return `media/songs/${artistId}/${albumId}/${songId}.${extension}`;
};

export function generateAlbumKey(
    artistId: string,
    albumId: string,
    extension: string
): string {
    return `media/images/${artistId}/${albumId}/cover.${extension}`
}