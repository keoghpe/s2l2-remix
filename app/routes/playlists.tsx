import type { LoaderArgs } from "@remix-run/node";
import { Form, NavLink, Outlet, useLoaderData } from "@remix-run/react";
import { useEffect, useState } from "react";

import { spotifyStrategy } from "~/services/auth.server";

export async function loader({ request }: LoaderArgs) {
  let data: { session: Session | null; playlists: Array } = {
    session: null,
    playlists: [],
  };
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

  return data;
}

const Navbar = ({ user }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <nav className="flex items-center justify-between bg-gray-800 p-4">
      <div className="font-medium text-white">Your App</div>
      {user ? (
        <div className="relative">
          <img
            src={user.image}
            alt={user.name}
            className="h-8 w-8 cursor-pointer rounded-full"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          />
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 rounded-lg bg-gray-800 py-2 shadow-xl">
              <Form action={"/logout"} method="post">
                <button className="block px-4 py-2 font-medium text-white hover:bg-gray-700">
                  {"Logout"}
                </button>
              </Form>
            </div>
          )}
        </div>
      ) : (
        <Form action={"/auth/spotify"} method="post">
          <button>{"Log in with Spotify"}</button>
        </Form>
      )}
    </nav>
  );
};

export default function Index() {
  const data = useLoaderData<typeof loader>();
  const user = data?.session.user;

  const navData = data
    ? data.playlists
        .filter(({ name }) => /s2l2/i.test(name))
        .map(({ name, id }) => ({
          name,
          id,
        }))
    : [];

  return (
    // bg-gray-800
    <div>
      <div className="relative flex h-screen flex-col ">
        <Navbar user={user}></Navbar>
        <div className="fixed top-0 bottom-0 left-0 z-50 h-screen w-64 bg-gray-900">
          <nav className="max-h-screen overflow-y-auto">
            {navData.map(({ id, name }) => (
              <NavLink
                to={id}
                className={({ isActive }) =>
                  `block py-2 px-4 font-medium text-orange-500 hover:text-orange-200 ${
                    isActive ? "bg-white" : ""
                  }`
                }
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
    </div>
  );
}
