"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, Calendar } from "lucide-react";
import type { Transaction } from '@/lib/types';

interface MonthlySummaryProps {
  balance: number;
  transactions: Transaction[];
}

interface MonthOption {
  value: string;
  label: string;
}

export default function MonthlySummary({ balance, transactions }: MonthlySummaryProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  // Generar opciones de meses disponibles
  const monthOptions = useMemo(() => {
    const months = new Set<string>();
    
    // Agregar mes actual
    const currentDate = new Date();
    const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    months.add(currentMonth);
    
    // Agregar meses de las transacciones existentes
    transactions.forEach(transaction => {
      const transactionDate = new Date(transaction.date);
      const monthKey = `${transactionDate.getFullYear()}-${String(transactionDate.getMonth() + 1).padStart(2, '0')}`;
      months.add(monthKey);
    });
    
    return Array.from(months)
      .sort()
      .reverse()
      .map(month => {
        const [year, monthNum] = month.split('-');
        const date = new Date(parseInt(year), parseInt(monthNum) - 1);
        return {
          value: month,
          label: date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
        };
      });
  }, [transactions]);

  // Establecer mes actual como seleccionado por defecto
  useMemo(() => {
    if (monthOptions.length > 0 && !selectedMonth) {
      setSelectedMonth(monthOptions[0].value);
    }
  }, [monthOptions, selectedMonth]);

  // Calcular datos del mes seleccionado
  const monthlyData = useMemo(() => {
    if (!selectedMonth) return { income: 0, expenses: 0, transactions: [] };
    
    const [year, month] = selectedMonth.split('-');
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0);
    
    const monthTransactions = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= startDate && transactionDate <= endDate;
    });
    
    const income = monthTransactions
      .filter(t => t.type === 'deposit')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return { income, expenses, transactions: monthTransactions };
  }, [transactions, selectedMonth]);

  // Datos para el gráfico de torta
  const pieChartData = useMemo(() => {
    if (monthlyData.income === 0 && monthlyData.expenses === 0) {
      return [
        { name: 'Sin datos', value: 1, color: '#e5e7eb' }
      ];
    }
    
    return [
      { name: 'Ingresos', value: monthlyData.income, color: '#10b981' },
      { name: 'Gastos', value: monthlyData.expenses, color: '#ef4444' }
    ].filter(item => item.value > 0);
  }, [monthlyData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', { 
      style: 'currency', 
      currency: 'ARS' 
    }).format(amount);
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Resumen Mensual
        </CardTitle>
        <CardDescription>
          Ingresos y gastos del mes seleccionado con visualización gráfica.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {/* Selector de mes */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Mes:</label>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Seleccionar mes" />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Resumen de ingresos y gastos */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm text-green-600 font-medium">Ingresos</p>
              <p className="text-lg font-bold text-green-700">
                {formatCurrency(monthlyData.income)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
            <TrendingDown className="h-5 w-5 text-red-600" />
            <div>
              <p className="text-sm text-red-600 font-medium">Gastos</p>
              <p className="text-lg font-bold text-red-700">
                {formatCurrency(monthlyData.expenses)}
              </p>
            </div>
          </div>
        </div>

        {/* Balance del mes */}
        <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-center">
            <p className="text-sm text-blue-600 font-medium">Balance del Mes</p>
            <p className={`text-2xl font-bold ${monthlyData.income - monthlyData.expenses >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
              {formatCurrency(monthlyData.income - monthlyData.expenses)}
            </p>
          </div>
        </div>

        {/* Gráfico de torta */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieChartData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {pieChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), '']}
                labelFormatter={() => ''}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Información adicional */}
        <div className="text-center text-sm text-muted-foreground">
          <p>{monthlyData.transactions.length} transacciones en este mes</p>
        </div>
      </CardContent>
    </Card>
  );
}
