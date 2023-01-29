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

export async function loader({ request, params }: LoaderArgs) {
  invariant(params.playlistId, "noteId not found");

  let data: { session: Session | null; tracks: Array } = {
    session: null,
    tracks: [],
  };
  data.session = await spotifyStrategy.getSession(request);

  let fetchMore = true;
  let offset = 0;

  while (fetchMore) {
    const response = await fetch(
      `https://api.spotify.com/v1/playlists/${params.playlistId}/tracks?limit=50&offset=${offset}`,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${data?.session?.accessToken}`,
          Accept: "application/json",
          // "Access-Control-Allow-Origin": "http://localhost:3000",
        },
        method: "GET",
      }
    );
    if (!response.ok) {
      throw new Error(response.statusText);
      //     throw new Response("Not Found", { status: 404 });
    }
    let tracks = await response.json();
    data.tracks = [...data.tracks, ...tracks.items];

    fetchMore = tracks.items.length > 0;
    offset += 50;
  }

  data.tracks.reverse();

  return data;
}

const Album = ({ name, image, id, artist }) => {
  return (
    <Link to={`./albums/${id}`}>
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
      {outlet}
      <div className={`grid grid-cols-2 gap-4 xl:grid-cols-3`}>
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
