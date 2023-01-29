import { Form, Link, useLoaderData } from "@remix-run/react";
import { useState } from "react";

export default ({ children }) => {
  const data = useLoaderData();
  const user = data?.session?.user;

  return (
    <div className="relative flex h-screen flex-col">
      <Navbar user={user}></Navbar>
      <div className="pt-[70px]">{children}</div>
    </div>
  );
};

const Navbar = ({ user }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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
          <button>{"Log in with Spotify"}</button>
        </Form>
      )}
    </nav>
  );
};
