import type { IconType } from "react-icons";
import { LuChevronRight } from "react-icons/lu";
import { useNavigate } from "react-router-dom";

export interface MissingLink {
  name: string;
  href: string;
  description: string;
  icon: IconType;
}

const MissingLinks = ({ links }: { links: MissingLink[] }) => {
  const navigate = useNavigate();

  return (
    <ul className="rp-card overflow-hidden">
      {links.map((link) => (
        <li
          key={link.href}
          className="relative flex min-h-16 items-center gap-4 border-b border-rule px-5 py-3 transition-colors last:border-b-0 hover:bg-sleeve-2"
        >
          <link.icon className="h-5 w-5 flex-none text-ink-2" aria-hidden="true" />
          <div className="min-w-0 flex-auto">
            <h3 className="text-[17px] font-semibold">
              <button type="button" onClick={() => navigate(link.href)} className="text-left">
                <span className="absolute inset-0" aria-hidden="true" />
                {link.name}
              </button>
            </h3>
            <p className="rp-muted mt-0.5 text-[15px]">{link.description}</p>
          </div>
          <LuChevronRight className="h-5 w-5 flex-none text-ink-2" aria-hidden="true" />
        </li>
      ))}
    </ul>
  );
};

export default MissingLinks;
