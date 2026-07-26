import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { inventoryUnits } from "@/data/mockData";

export default function InventoryUnits() {
  return (
    <div>
      <PageHeader
        title="Inventory Units"
        description="Unidades individuais rastreadas por número de série, localização e status de preservação."
      />
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número de Série</TableHead>
                <TableHead>Material</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventoryUnits.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.serialNumber}</TableCell>
                  <TableCell>{item.material}</TableCell>
                  <TableCell>{item.location}</TableCell>
                  <TableCell>
                    <StatusBadge status={item.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
