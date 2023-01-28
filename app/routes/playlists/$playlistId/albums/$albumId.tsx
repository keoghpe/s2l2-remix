import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useCatch, useLoaderData, useSubmit } from "@remix-run/react";
import invariant from "tiny-invariant";
import { spotifyStrategy } from "~/services/auth.server";

export async function loader({ request, params }: LoaderArgs) {
  invariant(params.playlistId, "noteId not found");

  let data: { session: Session | null; album: Array } = {
    session: null,
    album: {},
  };
  data.session = await spotifyStrategy.getSession(request);

  const response = await fetch(
    `https://api.spotify.com/v1/albums/${params.albumId}`,
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${data?.session?.accessToken}`,
        Accept: "application/json",
      },
      method: "GET",
    }
  );
  if (!response.ok) {
    throw new Error(response.statusText);
    //     throw new Response("Not Found", { status: 404 });
  }

  data.album = await response.json();

  return data;
}

export async function action({ request, params }: ActionArgs) {
  let session = await spotifyStrategy.getSession(request);

  const uris = [];
  const formData = await request.formData();
  const trackId = formData.get("trackId");
  let thingToPlay = {};

  if (trackId) {
    thingToPlay = {
      uris: [`spotify:track:${trackId}`],
    };
  } else {
    thingToPlay = {
      context_uri: `spotify:album:${params.albumId}`,
    };
  }

  const response = await fetch(`https://api.spotify.com/v1/me/player/play`, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Bearer ${session?.accessToken}`,
      Accept: "application/json",
    },
    method: "PUT",
    body: JSON.stringify(thingToPlay),
  });
  if (!response.ok) {
    throw new Error(response.statusText);
  }

  return redirect(`/playlists/${params.playlistId}/albums/${params.albumId}`);
}

export default function AlbumDetailsPage() {
  const data = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const name = data.album?.name;
  const id = data.album?.id;
  const artist = data.album?.artists[0]?.name;
  const image = data.album?.images[0]?.url;
  const tracks = data.album.tracks.items;

  console.log(data.album);

  return (
    <div>
      <div className="rounded-lg bg-gray-800 p-6">
        <div className="grid grid-cols-2">
          <div>
            <img src={image} alt={name} className="w-full rounded-lg" />
            <h2 className="mt-4 text-2xl font-medium text-white">{name}</h2>
            <p className="text-gray-500">{artist}</p>
            <Form
              onClick={(e) => {
                e.preventDefault();
                submit(e.currentTarget);
              }}
              method="post"
              className="row-span-1"
            >
              PLAY THIS ALBUM
            </Form>
          </div>
          <div>
            {tracks.map(({ name, duration_ms, id }) => (
              <Form
                onClick={(e) => {
                  e.preventDefault();
                  submit(e.currentTarget);
                }}
                method="post"
                className="row-span-1"
              >
                {name} {Math.floor(duration_ms / 60 / 1000)}:
                {Math.round((duration_ms / 1000) % 60)}
                <input hidden value={id} name="trackId" />
              </Form>
            ))}
          </div>
        </div>
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
