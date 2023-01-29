import type { LoaderArgs } from "@remix-run/node";
import { Form, Link, NavLink, Outlet, useLoaderData } from "@remix-run/react";
import { useEffect, useState } from "react";
import ViewWithNavbar from "~/components/ViewWithNavbar";

import { spotifyStrategy } from "~/services/auth.server";

export async function loader({ request }: LoaderArgs) {
  let data: { session: Session | null; playlists: Array } = {
    session: null,
    playlists: [],
  };
  try {
    data.session = await spotifyStrategy.getSession(request);

    let fetchMore = true;
    let offset = 0;

    while (fetchMore) {
      const response = await fetch(
        `https://api.spotify.com/v1/me/playlists?limit=50&offset=${offset}`,
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
      }

      let playlists = await response.json();
      data.playlists = [...data.playlists, ...playlists.items];

      fetchMore = playlists.items.length > 0;
      offset += 50;
    }
  } catch {}

  return data;
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
  console.log(data);

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
    <ViewWithNavbar>
      <div className={`grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3`}>
        {playlists.map((playlist) => (
          <Playlist {...playlist} />
        ))}
      </div>
    </ViewWithNavbar>
  );
}
