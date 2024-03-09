import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { isRouteErrorResponse, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import { AlbumTile } from "~/components/AlbumTile";
import { getAlbumIdsForTag } from "~/models/hashTag.server";
import { spotifyStrategy } from "~/services/auth.server";
import { fetchAlbums } from "~/services/spotifyApi.server";
import { requireUserId } from "~/session.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const spotifyUserId = await requireUserId(request);
  invariant(params.tag, "tag not found");
  let tag = String(params.tag);

  let session = await spotifyStrategy.getSession(request);
  invariant(session, "session not present");

  let albumIds = await getAlbumIdsForTag({ spotifyUserId, tag: tag });

  let albums = await fetchAlbums(
    albumIds.map(({ spotifyAlbumId }) => spotifyAlbumId),
    session.accessToken
  );

  return json({
    session,
    albums,
    tag,
  });
}

export default function TagDetailsPage() {
  const { tag, albums } = useLoaderData<typeof loader>();

  return (
    <div>
      <h1 className="my-5 text-center text-3xl text-white">#{tag}</h1>
      <div className={`grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3`}>
        {albums["albums"].map((album) => (
          <AlbumTile {...{ album }} />
        ))}
      </div>
    </div>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  console.error(error);

  if (isRouteErrorResponse(error) && error.status == 404) {
    return <div>Note not found</div>;
  }

  return <div>An unexpected error occurred: {error.message}</div>;
}
