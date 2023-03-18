import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Form,
  Link,
  Outlet,
  useCatch,
  useLoaderData,
  useOutlet,
  useOutletContext,
  useSubmit,
} from "@remix-run/react";
import { User } from "remix-auth-spotify";
import invariant from "tiny-invariant";
import { AlbumTile } from "~/components/AlbumTile";
import { spotifyStrategy } from "~/services/auth.server";
import { cached } from "~/services/redis.server";
import {
  fetchPlaylist,
  SpotifyAlbum,
  SpotifyPlaylistItem,
  SpotifyTrack,
} from "~/services/spotifyApi.server";

export async function loader({ request, params }: LoaderArgs) {
  invariant(params.playlistId, "playlist not found");

  const session: Session & { user: User } = await spotifyStrategy.getSession(
    request
  );
  invariant(session, "session is null!");

  let { playlist, tracks } = await cached(
    `playlist:${session.user.id}:${params.playlistId}`,
    async () => await fetchPlaylist(session.accessToken, params.playlistId)
  );

  return { session, playlist, tracks };
}

const extractAlbums = (tracks: SpotifyPlaylistItem[]): SpotifyAlbum[] => {
  const albums: SpotifyAlbum[] = [];

  tracks
    .map((i) => i.track)
    .forEach((t) => {
      if (!albums.find((a) => a.id === t.album.id)) {
        albums.push(t.album);
      }
    });

  return albums;
};

export default function PlaylistDetailsPage() {
  const { playlist, tracks } = useLoaderData<typeof loader>();
  const [player, deviceId] = useOutletContext();

  return (
    <div>
      <Link to={`/${playlist.id}`}>
        <h1 className="my-5 text-center text-3xl text-white">
          {playlist.name}
        </h1>
      </Link>
      <Outlet context={[player, deviceId]} />
      <div className={`grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3`}>
        {extractAlbums(tracks).map((album) => (
          <AlbumTile {...{ album }} />
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
