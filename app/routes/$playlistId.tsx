import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Form,
  Link,
  Outlet,
  useCatch,
  useLoaderData,
  useOutlet,
  useSubmit,
} from "@remix-run/react";
import invariant from "tiny-invariant";
import { spotifyStrategy } from "~/services/auth.server";
import { cached } from "~/services/redis.server";
import { fetchPlaylist } from "~/services/spotifyApi.server";

export async function loader({ request, params }: LoaderArgs) {
  invariant(params.playlistId, "playlist not found");

  let data: {
    session: Session | null;
    tracks: Array;
    playlist: Object | null;
  } = {
    session: null,
    tracks: [],
    playlist: null,
  };
  data.session = await spotifyStrategy.getSession(request);

  let { playlist, tracks } = await cached(
    `playlist:${data.session.user.id}:${params.playlistId}`,
    async () => {
      return await fetchPlaylist(data.session.accessToken, params.playlistId);
    }
  );

  data.playlist = playlist;
  data.tracks = tracks;

  return data;
}

const Album = ({ name, image, id, artist }) => {
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

export default function PlaylistDetailsPage() {
  const data = useLoaderData<typeof loader>();
  const tracks = data.tracks;
  const albums = [];
  const outlet = useOutlet();

  tracks
    ?.map((i) => i.track)
    .forEach((t) => {
      if (!albums.find((a) => a.id === t.album.id)) {
        albums.push({
          name: t.album?.name,
          id: t.album?.id,
          artist: t.album?.artists[0]?.name,
          image: t.album?.images[0]?.url,
        });
      }
    });

  return (
    <div>
      <Link to={`/${data.playlist.id}`}>
        <h1 className="my-5 text-center text-3xl text-white">
          {data.playlist.name}
        </h1>
      </Link>
      {outlet}
      <div className={`grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3`}>
        {albums.map((album) => (
          <Album {...album} />
        ))}
      </div>
    </div>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  console.error(error);

  return <div>An unexpected error occurred: {error.message}</div>;
}

export function CatchBoundary() {
  const caught = useCatch();

  if (caught.status === 404) {
    return <div>Note not found</div>;
  }

  throw new Error(`Unexpected caught response with status: ${caught.status}`);
}
