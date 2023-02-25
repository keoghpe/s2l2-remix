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
  useSubmit,
} from "@remix-run/react";
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

  return redirect(`/${params.playlistId}/albums/${params.albumId}/notes`);
}

const PlayIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="mx-1 h-9 w-9"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z"
    />
  </svg>
);

const TabLink = ({ to, children }) => (
  <NavLink
    className={({ isActive }) => {
      const additional = isActive ? "text-orange-600" : "";
      return `${additional} cursor-pointer p-5 text-white hover:bg-white hover:bg-opacity-10`;
    }}
    to={to}
  >
    {children}
  </NavLink>
);

const TrackList = ({ tracks, submit }) =>
  tracks.map(({ name, duration_ms, id }) => (
    <Form
      onClick={(e) => {
        e.preventDefault();
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
      <input hidden value={id} name="trackId" />
    </Form>
  ));

export default function AlbumDetailsPage() {
  const data = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const name = data.album?.name;
  const id = data.album?.id;
  const artist = data.album?.artists[0]?.name;
  const image = data.album?.images[0]?.url;
  const tracks = data.album.tracks.items;
  const outlet = useOutlet();

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
                    submit(e.currentTarget);
                  }}
                  method="post"
                  className="row-span-1 float-right text-2xl text-white "
                >
                  <PlayIcon />
                </Form>
              </h2>
            </div>
            <div>
              <TrackList submit={submit} tracks={tracks} />
            </div>
            <p className="text-gray-500">{artist}</p>
          </div>
          <Outlet />
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
