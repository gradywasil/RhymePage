import { LuCircleUser, LuHouse, LuLogIn, LuNotebook, LuPenLine, LuUserPlus } from "react-icons/lu";
import MissingLinks, { type MissingLink } from "./MissingLinks";

const home: MissingLink = {
  name: "Home",
  href: "/",
  description: "Back to the RhymePage front page.",
  icon: LuHouse,
};

const unloggedLinks: MissingLink[] = [
  {
    name: "Write",
    href: "/notes/new",
    description: "Try the editor without creating an account.",
    icon: LuPenLine,
  },
  {
    name: "Create an account",
    href: "/register",
    description: "Get started with a free account.",
    icon: LuUserPlus,
  },
  {
    name: "Sign in",
    href: "/login",
    description: "Sign in with email and password, or with Google.",
    icon: LuLogIn,
  },
  home,
];

const loggedLinks: MissingLink[] = [
  {
    name: "Notebook",
    href: "/notes",
    description: "Your collection of notes.",
    icon: LuNotebook,
  },
  {
    name: "Write",
    href: "/notes/new",
    description: "Start a new note.",
    icon: LuPenLine,
  },
  {
    name: "Your profile",
    href: "/profile",
    description: "Your profile, with a way through to your settings.",
    icon: LuCircleUser,
  },
  home,
];

interface MissingProps {
  loggedIn: boolean;
}

const Missing = ({ loggedIn }: MissingProps) => {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-5 pb-10 md:px-10 md:pt-10">
      <h1 className="rp-title text-[34px] md:text-[44px]">
        This page isn't in the notebook
      </h1>
      <p className="rp-muted mt-3 text-[17px]">
        The link may be out of date. Here is where else you can go.
      </p>

      <div className="mt-8">
        <h2 className="sr-only">Popular pages</h2>
        <MissingLinks links={loggedIn ? loggedLinks : unloggedLinks} />
      </div>
    </div>
  );
};

export default Missing;
