import type { LinksFunction, LoaderArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Form,
  Link,
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useRouteLoaderData,
} from "@remix-run/react";
import React, { useEffect } from "react";
import { spotifyStrategy } from "./services/auth.server";

// import { getUser } from "./session.server";
import tailwindStylesheetUrl from "./styles/tailwind.css";

export const links: LinksFunction = () => {
  return [
    { rel: "stylesheet", href: tailwindStylesheetUrl },
    { rel: "manifest", href: "/manifest.json" },
  ];
};

export const meta: MetaFunction = () => ({
  charset: "utf-8",
  title: "Shit 2 Listen 2",
  viewport: "width=device-width,initial-scale=1",
});

export async function loader({ request }: LoaderArgs) {
  let data: { session: Session | null } = {
    session: null,
  };

  data.session = await spotifyStrategy.getSession(request);

  return json(data);
}

export default function App() {
  const data = useLoaderData<typeof loader>();
  const user = data?.session?.user;
  const token = data?.session?.accessToken;

  const track = {
    name: "",
    album: {
      images: [{ url: "" }],
    },
    artists: [{ name: "" }],
  };

  const [player, setPlayer] = React.useState(null);
  const [deviceId, setDeviceId] = React.useState(null);
  const [is_paused, setPaused] = React.useState(false);
  const [is_active, setActive] = React.useState(false);
  const [current_track, setTrack] = React.useState(track);

  if (token) {
    React.useEffect(() => {
      const script = document.createElement("script");

      script.src = "https://sdk.scdn.co/spotify-player.js";
      script.async = true;
      document.body.appendChild(script);

      window.onSpotifyWebPlaybackSDKReady = () => {
        const splayer = new window.Spotify.Player({
          name: "S2L2",
          getOAuthToken: (cb) => {
            cb(token);
          },
          volume: 0.5,
        });

        setPlayer(splayer);

        splayer.addListener("ready", ({ device_id }) => {
          console.log("Ready with Device ID", device_id);
          setDeviceId(device_id);
        });

        splayer.addListener("not_ready", ({ device_id }) => {
          console.log("Device ID has gone offline", device_id);
        });

        splayer.connect();

        splayer.addListener("player_state_changed", (state) => {
          console.log("player state changed");

          if (!state) {
            return;
          }

          setTrack(state.track_window.current_track);
          setPaused(state.paused);

          player.getCurrentState().then((state) => {
            !state ? setActive(false) : setActive(true);
          });
        });
      };
    }, [token]);
  }

  return (
    <html lang="en" className="h-full">
      <head>
        <Meta />
        <Links />
      </head>
      <body className="h-full bg-gray-900">
        <div className="relative flex h-screen flex-col">
          <Navbar user={user} current_track={current_track}></Navbar>
          <div className="pt-[70px]">
            <Outlet context={[player, deviceId]} />
          </div>
        </div>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}

const Navbar = ({ user, current_track }) => {
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);

  return (
    <nav className="fixed top-0 flex w-full items-center justify-between bg-gray-800 p-4">
      <Link className="text-lg font-medium text-white" to={"/"}>
        Shit 2 Listen 2
      </Link>
      {user ? (
        <div className="relative">
          <div className="container">
            <div className="main-wrapper">
              <img
                src={current_track.album.images[0].url}
                className="now-playing__cover"
                alt=""
              />

              <div className="now-playing__side">
                <div className="now-playing__name">{current_track.name}</div>

                <div className="now-playing__artist">
                  {current_track.artists[0].name}
                </div>
              </div>
            </div>
          </div>
          <img
            src={user.image}
            alt={user.name}
            className="h-8 w-8 cursor-pointer rounded-full"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          />
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 rounded-lg bg-gray-800 py-2 shadow-xl">
              <Form action={"/auth/logout"} method="post">
                <button className="block px-4 py-2 font-medium text-white hover:bg-gray-700">
                  {"Logout"}
                </button>
              </Form>
            </div>
          )}
        </div>
      ) : (
        <Form action={"/auth/spotify"} method="post">
          <button className="text-white">{"Log in with Spotify"}</button>
        </Form>
      )}
    </nav>
  );
};
