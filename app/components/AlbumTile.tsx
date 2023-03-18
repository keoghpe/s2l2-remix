import { Link } from "@remix-run/react";

export const AlbumTile = ({ album }: { album: SpotifyAlbum }) => {
  const id = album.id;
  const name = album.name;
  const artist = album.artists[0]?.name;
  const image = album.images[0]?.url;

  return (
    <Link to={`./albums/${id}/notes`}>
      <div className="rounded-lg bg-gray-800 p-6">
        <img src={image} alt={name} className="w-full rounded-lg" />
        <h2 className="mt-4 text-2xl font-medium text-white">{name}</h2>
        <p className="text-gray-500">{artist}</p>
      </div>
    </Link>
  );
};
