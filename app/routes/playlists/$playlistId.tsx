import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useCatch, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import { spotifyStrategy } from "~/services/auth.server";

export async function loader({ request, params }: LoaderArgs) {
  invariant(params.playlistId, "noteId not found");

  let data: { session: Session | null; playlist: Object | null } = {
    session: null,
    playlist: null,
  };
  data.session = await spotifyStrategy.getSession(request);

  const response = await fetch(
    `https://api.spotify.com/v1/playlists/${params.playlistId}`,
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
  data = data || {};
  data.playlist = await response.json();

  return data;
}

// export async function action({ request, params }: ActionArgs) {
//   const userId = await requireUserId(request);
//   invariant(params.noteId, "noteId not found");

//   await deleteNote({ userId, id: params.noteId });

//   return redirect("/notes");
// }

export default function PlaylistDetailsPage() {
  const data = useLoaderData<typeof loader>();
  const name = data.playlist?.name;
  const images = data.playlist?.images;
  const tracks = data.playlist?.tracks;
  const albums = [];

  tracks?.items
    .map((i) => i.track)
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
      <h1>{name}</h1>
      {images ? <img src={images[0].url} alt="" /> : ""}
      {albums.map((album) => (
        <div>
          <h2>{album.name}</h2>
          <h2>{album.id}</h2>
          <img src={album.image} alt="" />
        </div>
      ))}
      {/* <h1>{JSON.stringify(data.playlist)}</h1> */}
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
