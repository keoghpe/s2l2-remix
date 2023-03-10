import { json, LoaderArgs } from "@remix-run/node";
import { Form, Link, NavLink, Outlet, useLoaderData } from "@remix-run/react";
import { useEffect, useState } from "react";

import { spotifyStrategy } from "~/services/auth.server";
import { cached } from "~/services/redis.server";
import { fetchPlaylists } from "~/services/spotifyApi.server";

export async function loader({ request }: LoaderArgs) {
  let data: { session: Session | null; playlists: Array } = {
    session: null,
    playlists: [],
  };

  data.session = await spotifyStrategy.getSession(request);

  if (data.session?.user) {
    data.playlists = await cached(
      `playlists:${data.session.user.id}`,
      async () => {
        return await fetchPlaylists(data.session.accessToken);
      }
    );
  }

  return json(data);
}

const Playlist = ({ name, image, id }) => {
  return (
    <Link to={`/${id}`}>
      <div className="grid grid-cols-4 items-center gap-4 rounded-lg bg-gray-800 p-6 hover:bg-gray-700">
        <img src={image} alt={name} className="rounded-md" />
        <h2 className="col-span-3 text-2xl font-medium text-white">{name}</h2>
      </div>
    </Link>
  );
};

export default function Index() {
  const data = useLoaderData<typeof loader>();

  const playlists = data
    ? data.playlists
        .filter(({ name }) => /s2l2/i.test(name))
        .map(({ name, id, images }) => ({
          name,
          id,
          image: images[0].url,
        }))
    : [];

  return (
    <div className={`grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3`}>
      {playlists.map((playlist) => (
        <Playlist {...playlist} />
      ))}
    </div>
  );
}
