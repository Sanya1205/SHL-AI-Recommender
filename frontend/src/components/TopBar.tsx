import { NavLink } from "react-router-dom";
import { Bell, HelpCircle } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard" },
  { to: "/compare", label: "Compare" },
  { to: "/upload", label: "Analyze JD" },
];

export default function TopBar({ title = "Assessment Copilot" }: { title?: string }) {
  const { user } = useAuth();
  const initials = user
    ? user.name
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-outline/20 bg-background/80 px-8 backdrop-blur-md">
      <div className="flex items-center gap-8">
        <span className="text-lg font-bold text-text-primary">{title}</span>
        <nav className="hidden items-center gap-6 md:flex">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `pb-1 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-b-2 border-primary text-primary-hover"
                    : "text-text-secondary hover:text-text-primary"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <button className="text-text-secondary transition-colors hover:text-primary-hover">
          <Bell size={20} />
        </button>
        <button className="text-text-secondary transition-colors hover:text-primary-hover">
          <HelpCircle size={20} />
        </button>
        <NavLink
          to="/profile"
          className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-outline/60 text-xs font-bold text-white"
          style={{ backgroundColor: user?.avatar_color || "#4d4465" }}
        >
          {initials}
        </NavLink>
      </div>
    </header>
  );
}
