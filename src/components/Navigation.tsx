import { Link, useLocation } from "react-router-dom";

export function Navigation() {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Home", icon: "🏠" },
    { path: "/workout", label: "Workout", icon: "💪" },
    { path: "/progress", label: "Progress", icon: "📈" },
    { path: "/templates", label: "Templates", icon: "📋" },
    { path: "/calendar", label: "Calendar", icon: "📅" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
      <div className="max-w-md mx-auto px-4">
        <div className="flex justify-between">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`p-4 flex flex-col items-center ${
                location.pathname === item.path
                  ? "text-blue-500"
                  : "text-gray-500"
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
