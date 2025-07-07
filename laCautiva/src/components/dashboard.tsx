"use client";

import { useState, useMemo } from 'react';
import type { Transaction } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { useTransactions } from '@/hooks/use-transactions';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, MinusCircle, LogOut, User } from 'lucide-react';

import BalanceCard from '@/components/balance-card';
import TransactionForm from '@/components/transaction-form';
import TransactionsList from '@/components/transactions-list';
import MonthlySummary from '@/components/spending-suggestion';

export function Dashboard() {
  const { transactions, addTransaction, loading: transactionsLoading } = useTransactions();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'deposit' | 'expense'>('deposit');
  const { userData, logout, isAdmin } = useAuth();

  const balance = useMemo(() => {
    return transactions.reduce((acc, t) => {
      if (t.type === 'deposit') {
        return acc + t.amount;
      }
      return acc - t.amount;
    }, 0);
  }, [transactions]);

  const handleAddTransaction = async (data: { amount: number; description: string; category: string }) => {
    const newTransaction = {
      type: dialogType,
      amount: data.amount,
      description: data.description,
      category: data.category,
      date: new Date().toISOString(),
    };
    await addTransaction(newTransaction);
  };

  const openDialog = (type: 'deposit' | 'expense') => {
    setDialogType(type);
    setDialogOpen(true);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight text-foreground">
            Gestor del Centro de Jubilados "LA CAUTIVA"
          </h1>
          <p className="text-muted-foreground">Una forma sencilla de gestionar tus finanzas.</p>
          {userData && (
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{userData.name || userData.email}</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                {isAdmin ? 'Administrador' : 'Visualizador'}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <Button onClick={() => openDialog('deposit')} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <PlusCircle className="mr-2 h-4 w-4" />
                Añadir Depósito
              </Button>
              <Button variant="destructive" onClick={() => openDialog('expense')}>
                <MinusCircle className="mr-2 h-4 w-4" />
                Añadir Gasto
              </Button>
            </>
          )}
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
          </Button>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-1">
            <BalanceCard balance={balance} />
        </div>
        <div className="lg:col-span-2">
            <MonthlySummary balance={balance} transactions={transactions} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transacciones Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionsList transactions={transactions} />
        </CardContent>
      </Card>

      <TransactionForm
        key={dialogType}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        type={dialogType}
        onSubmit={handleAddTransaction}
      />
    </div>
  );
}
