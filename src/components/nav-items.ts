import { Boxes, ClipboardList, LayoutDashboard, Package, Settings, CalendarCheck } from "lucide-react";

export const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: CalendarCheck, label: "Plans", path: "/plans" },
  { icon: Package, label: "Materials", path: "/materials" },
  { icon: Boxes, label: "Inventory Units", path: "/inventory-units" },
  { icon: ClipboardList, label: "Work Orders", path: "/work-orders" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export function isNavItemActive(location: string, path: string) {
  return path === "/" ? location === "/" : location.startsWith(path);
}
