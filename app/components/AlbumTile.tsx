import { Link } from "@remix-run/react";
import { SpotifyAlbum } from "~/services/spotifyApi.server";

export type AlbumTileProps = {
  notesUrl: string;
  albumName: string;
  artistName: string;
  imageUrl: string;
}

export const albumToAlbumTileProps = (album: SpotifyAlbum): AlbumTileProps => {
  return {
    albumName: album.name,
    artistName: album.artists[0]?.name,
    imageUrl: album.images[0]?.url,
    notesUrl: `./albums/${album.id}/notes`
  }
}

export const AlbumTile = ({ albumName, artistName, imageUrl, notesUrl }: AlbumTileProps) => {
  return (
    <Link to={notesUrl}>
      <div className="rounded-lg bg-gray-800 p-6">
        <img src={imageUrl} alt={albumName} className="w-full rounded-lg" />
        <h2 className="mt-4 text-2xl font-medium text-white">{albumName}</h2>
        <p className="text-gray-500">{artistName}</p>
      </div>
    </Link>
  );
};
