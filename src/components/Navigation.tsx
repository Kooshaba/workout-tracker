import { Link, useLocation } from "react-router-dom";

export function Navigation() {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Home", icon: "🏠" },
    { path: "/workout", label: "Workout", icon: "💪" },
    { path: "/progress", label: "Progress", icon: "📈" },
    { path: "/templates", label: "Templates", icon: "📋" },
    { path: "/calendar", label: "Calendar", icon: "📅" },
    { path: "/coach", label: "Coach", icon: "🧠" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 overflow-x-auto">
      <div className="min-w-full px-4">
        <div className="flex whitespace-nowrap gap-2 pb-4 pt-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-shrink-0 flex-col items-center rounded-2xl px-4 py-3 transition-all duration-200 ${
                location.pathname === item.path
                  ? "bg-sky-950/60 text-sky-100"
                  : "text-slate-400 hover:-translate-y-0.5 hover:bg-slate-900/60 hover:text-slate-100"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
