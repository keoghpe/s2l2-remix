import { Link } from "@remix-run/react";

const PlaylistPreview = ({ playlist }: { playlist: SpotifyPlaylist }) => {
  const image = playlist.images[0].url;

  return (
    <Link to={`/${playlist.id}`}>
      <div className="grid grid-cols-4 items-center gap-4 rounded-lg bg-gray-800 p-6 hover:bg-gray-700">
        <img src={image} alt={playlist.name} className="rounded-md" />
        <h2 className="col-span-3 text-2xl font-medium text-white">
          {playlist.name}
        </h2>
      </div>
    </Link>
  );
};

export default PlaylistPreview;
