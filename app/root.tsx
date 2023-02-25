import type { LinksFunction, LoaderArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
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
import React from "react";
import ViewWithNavbar from "./components/ViewWithNavbar";
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

  return (
    <html lang="en" className="h-full">
      <head>
        <Meta />
        <Links />
      </head>
      <body className="h-full bg-gray-900">
        <div className="relative flex h-screen flex-col">
          <Navbar user={user}></Navbar>
          <div className="pt-[70px]">
            <Outlet />
          </div>
        </div>
        <ScrollRestoration />
        <Scripts />
        <script src="https://sdk.scdn.co/spotify-player.js"></script>
        <LiveReload />
      </body>
    </html>
  );
}

const Navbar = ({ user }) => {
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);

  return (
    <nav className="fixed top-0 flex w-full items-center justify-between bg-gray-800 p-4">
      <Link className="text-lg font-medium text-white" to={"/"}>
        Shit 2 Listen 2
      </Link>
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
