import { json, LoaderArgs } from "@remix-run/node";
import { Form, Link, NavLink, Outlet, useLoaderData } from "@remix-run/react";
import React from "react";
import PlaylistGrid from "~/components/PlaylistGrid";
import PlaylistPreview from "~/components/PlaylistPreview";

import { spotifyStrategy } from "~/services/auth.server";
import { cached } from "~/services/redis.server";
import { fetchPlaylists, SpotifyPlaylist } from "~/services/spotifyApi.server";

export async function loader({ request }: LoaderArgs) {
  let data: { session: Session | null; playlists: SpotifyPlaylist[] } = {
    session: null,
    playlists: [],
  };

  data.session = await spotifyStrategy.getSession(request);

  if (data.session?.user) {
    data.playlists = await cached(
      `playlists:${data.session.user.id}`,
      async () => {
        const playlists = await fetchPlaylists(data.session.accessToken);
        return playlists.filter(({ name }) => /s2l2/i.test(name));
      }
    );
  }

  return json(data);
}

export default function Index() {
  const { playlists } = useLoaderData<typeof loader>();

  return (
    <PlaylistGrid>
      {playlists.map((playlist) => (
        <PlaylistPreview {...{ playlist }} />
      ))}
    </PlaylistGrid>
  );
}
