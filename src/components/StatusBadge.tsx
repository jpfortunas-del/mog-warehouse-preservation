import { Badge } from "@/components/ui/badge";

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "cyan" | "navy"> = {
  // criticidade
  "Crítica": "destructive",
  "Alta": "navy",
  "Média": "default",
  "Baixa": "secondary",
  // planos / procedimentos
  "Ativo": "cyan",
  "Em revisão": "secondary",
  "Suspenso": "destructive",
  // unidades de inventário
  "Preservado": "cyan",
  "Em uso": "default",
  "Vencido": "destructive",
  "Quarentena": "navy",
  // ordens de serviço
  "Agendada": "secondary",
  "Em andamento": "cyan",
  "Concluída": "default",
  "Atrasada": "destructive",
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge variant={STATUS_VARIANTS[status] ?? "secondary"}>{status}</Badge>;
}
