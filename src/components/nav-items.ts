import { Boxes, ClipboardList, LayoutDashboard, Settings, CalendarCheck } from "lucide-react";

export const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Boxes, label: "Parts", path: "/parts" },
  { icon: CalendarCheck, label: "Plans", path: "/plans" },
  { icon: ClipboardList, label: "Work Orders", path: "/work-orders" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export function isNavItemActive(location: string, path: string) {
  return path === "/" ? location === "/" : location.startsWith(path);
}
