import { Link, useLocation } from "wouter";
import { isNavItemActive, navItems } from "@/components/nav-items";

export default function BottomNav() {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 border-t bg-sidebar flex items-center overflow-x-auto px-1 z-40">
      {navItems.map(item => {
        const isActive = isNavItemActive(location, item.path);
        return (
          <Link
            key={item.path}
            href={item.path}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg shrink-0 transition-colors ${
              isActive
                ? "text-sidebar-foreground bg-sidebar-accent/20"
                : "text-sidebar-foreground/60 hover:text-sidebar-foreground"
            }`}
            aria-label={item.label}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium whitespace-nowrap">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
