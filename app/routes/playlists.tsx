import type { LoaderArgs } from "@remix-run/node";
import { Form, NavLink, Outlet, useLoaderData } from "@remix-run/react";
import { useEffect, useState } from "react";

import { spotifyStrategy } from "~/services/auth.server";

export async function loader({ request }: LoaderArgs) {
  let data: { session: Session | null; playlists: Object | null } = {
    session: null,
    playlists: null,
  };
  data.session = await spotifyStrategy.getSession(request);

  const response = await fetch(
    "https://api.spotify.com/v1/me/playlists?limit=50",
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
  data = data || {};
  data.playlists = await response.json();

  return data;
}

export default function Index() {
  const data = useLoaderData<typeof loader>();
  const user = data?.session.user;

  const navData = data
    ? data.playlists.items
        .filter(({ name }) => /s2l2/i.test(name))
        .map(({ name, id }) => ({
          name,
          id,
        }))
    : [];

  return (
    <div className="relative flex h-screen flex-col bg-gray-800">
      <div className="fixed top-0 bottom-0 left-0 z-50 h-screen w-64 bg-gray-900">
        <nav className="overflow-y-auto">
          {navData.map(({ id, name }) => (
            <NavLink
              to={id}
              className="block py-2 px-4 font-medium text-orange-500 hover:text-orange-200"
            >
              {name}
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="relative flex-1">
        <Outlet></Outlet>
      </div>
    </div>
  );
}

// <div style={{ textAlign: "center", padding: 20 }}>
//   <Sidebar />
//   <h2>Welcome to Remix!</h2>
//   <p>
//     <a href="https://docs.remix.run">Check out the docs</a> to get started.
//   </p>
//   {user?.image ? <img src={user.image} alt="" /> : ""}
//   {user ? (
//     [
//       <p>
//         You are logged in as: {user.name} ({user?.email})
//       </p>,
//       <p>{user?.id}</p>,
//     ]
//   ) : (
//     <p>You are not logged in yet!</p>
//   )}
//   <Form action={user ? "/logout" : "/auth/spotify"} method="post">
//     <button>{user ? "Logout" : "Log in with Spotify"}</button>
//   </Form>
//   <Outlet />
// </div>
