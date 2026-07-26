import { Boxes, ClipboardList, Cog, Package, ShieldCheck, CalendarCheck } from "lucide-react";

export const navItems = [
  { icon: Cog, label: "Equipment Types", path: "/equipment-types" },
  { icon: ShieldCheck, label: "Preservation Procedures", path: "/preservation-procedures" },
  { icon: CalendarCheck, label: "Plans", path: "/plans" },
  { icon: Package, label: "Materials", path: "/materials" },
  { icon: Boxes, label: "Inventory Units", path: "/inventory-units" },
  { icon: ClipboardList, label: "Work Orders", path: "/work-orders" },
];
