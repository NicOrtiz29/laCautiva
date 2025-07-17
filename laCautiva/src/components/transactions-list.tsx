"use client";

import type { Transaction } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TransactionsListProps {
  transactions: Transaction[];
}

export default function TransactionsList({ transactions }: TransactionsListProps) {
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
        <p className="text-muted-foreground">Aún no hay transacciones.</p>
        <p className="text-sm text-muted-foreground">Añade un depósito o un gasto para empezar.</p>
      </div>
    );
  }

  const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Función para obtener el color de la categoría
  const getCategoryColor = (category: string) => {
    const categoryColors: Record<string, string> = {
      // Gastos
      'viajes': 'bg-blue-100 text-blue-800',
      'mantenimiento': 'bg-orange-100 text-orange-800',
      'limpieza': 'bg-green-100 text-green-800',
      'construccion': 'bg-purple-100 text-purple-800',
      'otros': 'bg-gray-100 text-gray-800',
      // Ingresos
      'cuota': 'bg-emerald-100 text-emerald-800',
      'donacion': 'bg-pink-100 text-pink-800',
      'subvencion': 'bg-indigo-100 text-indigo-800',
      'evento': 'bg-yellow-100 text-yellow-800',
      'otros_ingresos': 'bg-teal-100 text-teal-800'
    };
    return categoryColors[category] || 'bg-gray-100 text-gray-800';
  };

  // Función para obtener el nombre legible de la categoría
  const getCategoryLabel = (category: string) => {
    const categoryLabels: Record<string, string> = {
      'viajes': 'Viajes',
      'mantenimiento': 'Mantenimiento',
      'limpieza': 'Limpieza',
      'construccion': 'Construcción',
      'otros': 'Otros',
      'cuota': 'Cuota Mensual',
      'donacion': 'Donación',
      'subvencion': 'Subvención',
      'evento': 'Evento',
      'otros_ingresos': 'Otros Ingresos'
    };
    return categoryLabels[category] || category;
  };

  return (
    <div className="w-full overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descripción</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="text-right">Cantidad</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTransactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell className="font-medium">
                  {transaction.description.replace(/^[^-]+ - /, '')}
                </TableCell>
                <TableCell>
                  {transaction.category && (
                    <Badge className={getCategoryColor(transaction.category)}>
                      {getCategoryLabel(transaction.category)}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={transaction.type === 'deposit' ? 'default' : 'destructive'} className={cn(transaction.type === 'deposit' && 'bg-accent text-accent-foreground')}>
                    {transaction.type === 'deposit' ? 'Depósito' : 'Gasto'}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                <TableCell
                  className={cn(
                    "text-right font-mono",
                    transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  {transaction.type === 'deposit' ? '+' : '-'}{" "}
                  {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(transaction.amount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
    </div>
  );
}
