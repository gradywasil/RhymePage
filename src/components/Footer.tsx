import { Link } from "react-router-dom";
const currentYear = new Date().getFullYear();

const Footer = () => {
  return (
    <footer className="app-footer flex w-full flex-none flex-wrap items-center justify-between gap-x-3 bg-primary px-3 text-primary-content sm:px-5">
      <p className="m-0 text-xs font-medium">
        © {currentYear} RhymePage.com<span className="hidden sm:inline"> · All rights reserved.</span>
      </p>
      <nav aria-label="Legal" className="flex items-center gap-4 text-xs font-medium">
        <Link className="inline-flex min-h-9 items-center underline underline-offset-4" to="/privacy">Privacy</Link>
        <Link className="inline-flex min-h-9 items-center underline underline-offset-4" to="/delete-account">Delete account</Link>
      </nav>
    </footer>
  );
};

export default Footer;
