import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { preservationProcedures } from "@/data/mockData";

export default function PreservationProcedures() {
  return (
    <div>
      <PageHeader
        title="Preservation Procedures"
        description="Procedimentos padronizados de preservação por tipo de equipamento."
      />
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Procedimento</TableHead>
                <TableHead>Tipo de Equipamento</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Frequência</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {preservationProcedures.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.code}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.equipmentType}</TableCell>
                  <TableCell>{item.method}</TableCell>
                  <TableCell>a cada {item.frequencyDays} dias</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
