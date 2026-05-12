"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateArtistImageKey = generateArtistImageKey;
exports.generateSongKey = generateSongKey;
exports.generateAlbumKey = generateAlbumKey;
function generateArtistImageKey(artistId, extension) {
    return `media/artists/${artistId}/cover.${extension}`;
}
function generateSongKey(artistId, albumId, songId, extension = '.flac') {
    return `media/songs/${artistId}/${albumId}/${songId}.${extension}`;
}
;
function generateAlbumKey(artistId, albumId, extension) {
    return `media/images/${artistId}/${albumId}/cover.${extension}`;
}
