import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { equipmentTypes } from "@/data/mockData";

export default function EquipmentTypes() {
  return (
    <div>
      <PageHeader
        title="Equipment Types"
        description="Categorias de equipamentos monitorados no processo de preservação de warehouse."
      />
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Criticidade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {equipmentTypes.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.code}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>
                    <StatusBadge status={item.criticality} />
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
