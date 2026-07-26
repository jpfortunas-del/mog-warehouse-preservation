import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { maintenancePlans } from "@/data/mockData";

export default function MaintenancePlans() {
  return (
    <div>
      <PageHeader
        title="Maintenance Plans"
        description="Planos de manutenção que agrupam procedimentos e periodicidade por equipamento."
      />
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Tipo de Equipamento</TableHead>
                <TableHead>Procedimento</TableHead>
                <TableHead>Periodicidade</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {maintenancePlans.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.code}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.equipmentType}</TableCell>
                  <TableCell>{item.procedure}</TableCell>
                  <TableCell>{item.periodicity}</TableCell>
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
