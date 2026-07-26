import { PageHeader } from "@/components/PageHeader";
import EquipmentTypes from "./EquipmentTypes";

export default function Settings() {
  return (
    <div>
      <PageHeader title="Settings" description="Equipment types configuration." />
      <EquipmentTypes />
    </div>
  );
}
