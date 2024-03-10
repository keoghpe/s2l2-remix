import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Form,
  Link,
  Outlet,
  isRouteErrorResponse,
  useLoaderData,
  useOutlet,
  useOutletContext,
  useSubmit,
} from "@remix-run/react";
import { User } from "remix-auth-spotify";
import invariant from "tiny-invariant";
import { AlbumTile, albumToAlbumTileProps } from "~/components/AlbumTile";
import { spotifyStrategy } from "~/services/auth.server";
import {
  fetchPlaylist,
  SpotifyAlbum,
  SpotifyPlaylistItem,
  SpotifyTrack,
} from "~/services/spotifyApi.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  invariant(params.playlistId, "playlist not found");

  const session: Session & { user: User } = await spotifyStrategy.getSession(
    request
  );
  invariant(session, "session is null!");

  let { playlist, tracks } = await fetchPlaylist(
    session.accessToken,
    params.playlistId
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
          <AlbumTile {...albumToAlbumTileProps(album)} />
        ))}
      </div>
    </div>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  console.error(error);

  if (isRouteErrorResponse(error) && error.status == 404) {
    return <div>Playlist not found</div>;
  }


  return <div>An unexpected error occurred: {error.message}</div>;
}
