import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Form,
  Link,
  NavLink,
  Outlet,
  useCatch,
  useLoaderData,
  useOutlet,
  useOutletContext,
  useSubmit,
} from "@remix-run/react";
import invariant from "tiny-invariant";
import PlayIcon from "~/components/PlayIcon";
import { spotifyStrategy } from "~/services/auth.server";
import { fetchAlbum, playThing } from "~/services/spotifyApi.server";

export async function loader({ request, params }: LoaderArgs) {
  invariant(params.playlistId, "playlist not found");
  invariant(params.albumId, "album not found");

  let session = await spotifyStrategy.getSession(request);
  invariant(session, "session not present");

  let album = await fetchAlbum(params.albumId, session.accessToken);

  return {
    session,
    album,
  };
}

export async function action({ request, params }: ActionArgs) {
  let session = await spotifyStrategy.getSession(request);
  invariant(session, "session not present");

  const formData = await request.formData();
  const trackId = formData.get("trackId");
  const deviceId = formData.get("deviceId");
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

  await playThing(deviceId, session.accessToken, thingToPlay);

  return redirect(`/${params.playlistId}/albums/${params.albumId}/notes`);
}

const TrackList = ({ tracks, submit, player, deviceId }) =>
  tracks.map(({ name, duration_ms, id }) => (
    <Form
      onClick={(e) => {
        e.preventDefault();
        player.activateElement();
        submit(e.currentTarget);
      }}
      method="post"
      className="row-span-1 mx-3 cursor-pointer p-1 text-white hover:bg-white hover:bg-opacity-10"
    >
      <p className="w-full">
        {name}
        <span className="float-right text-right">
          {Math.floor(duration_ms / 60 / 1000)}:
          {Math.round((duration_ms / 1000) % 60)}
        </span>
      </p>
      <input hidden value={id} name="trackId" readOnly />
      <input hidden value={deviceId} name="deviceId" readOnly />
    </Form>
  ));

export default function AlbumDetailsPage() {
  const { album } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const name = album.name;
  const artist = album.artists[0]?.name;
  const image = album.images[0]?.url;
  const tracks = album.tracks.items;
  const [player, deviceId] = useOutletContext();

  return (
    <div>
      <div className="my-3 rounded-lg bg-gray-800 p-6">
        <div className="grid grid-cols-2">
          <div className="grid grid-cols-2">
            <div>
              <img src={image} alt={name} className="w-full rounded-lg" />
              <h2 className="mt-4 text-2xl font-medium text-white">
                {name}

                <Form
                  onClick={(e) => {
                    e.preventDefault();
                    player.activateElement();
                    submit(e.currentTarget);
                  }}
                  method="post"
                  className="row-span-1 float-right text-2xl text-white "
                >
                  <PlayIcon />
                  {deviceId && (
                    <input hidden value={deviceId} name="deviceId" readOnly />
                  )}
                </Form>
              </h2>
            </div>
            <div>
              <TrackList
                submit={submit}
                tracks={tracks}
                player={player}
                deviceId={deviceId}
              />
            </div>
            <p className="text-gray-500">{artist}</p>
          </div>
          <Outlet context={[player, deviceId]} />
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
