"use client";

import { useState, useMemo } from 'react';
import type { Transaction } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { useTransactions } from '@/hooks/use-transactions';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PlusCircle, MinusCircle, LogOut, User } from 'lucide-react';
import { Dialog as UIDialog } from '@/components/ui/dialog';
import { Table } from '@/components/ui/table';
import { collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

import BalanceCard from '@/components/balance-card';
import TransactionForm from '@/components/transaction-form';
import TransactionsList from '@/components/transactions-list';
import MonthlySummary from '@/components/spending-suggestion';

type AuditoriaItem = {
  id: string;
  fecha?: { seconds: number };
  usuario?: string;
  accion?: string;
  detalles?: {
    amount?: number;
    description?: string;
    category?: string;
  };
};

export function Dashboard() {
  const { transactions, addTransaction, loading: transactionsLoading, deleteTransaction } = useTransactions();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'deposit' | 'expense'>('deposit');
  const { userData, logout, isAdmin } = useAuth();
  const [auditoriaOpen, setAuditoriaOpen] = useState(false);
  const [auditoria, setAuditoria] = useState<any[]>([]);
  const [loadingAuditoria, setLoadingAuditoria] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const { toast } = useToast();

  const fetchAuditoria = async () => {
    setLoadingAuditoria(true);
    const snapshot = await getDocs(collection(db, 'auditoria'));
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AuditoriaItem[];
    setAuditoria(
      data.sort((a, b) => {
        const fechaA = a.fecha?.seconds || 0;
        const fechaB = b.fecha?.seconds || 0;
        return fechaB - fechaA;
      })
    );
    setLoadingAuditoria(false);
  };

  const handleOpenAuditoria = async () => {
    await fetchAuditoria();
    setAuditoriaOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, 'auditoria', id));
    await fetchAuditoria();
  };

  const handleDeleteTransaction = (txId: string) => {
    setSelectedTx(transactions.find(tx => tx.id === txId));
    setDeleteDialogOpen(true);
  };

  const confirmDeleteTransaction = async () => {
    if (selectedTx) {
      try {
        await deleteTransaction(selectedTx.id);
        toast({ title: 'Transacción eliminada', description: 'La transacción fue eliminada correctamente.', variant: 'success' });
      } catch (error) {
        toast({ title: 'Error al eliminar', description: 'No se pudo eliminar la transacción.', variant: 'destructive' });
      }
      setDeleteDialogOpen(false);
      setSelectedTx(null);
    }
  };

  const handleEditTransaction = (tx: any) => {
    setSelectedTx(tx);
    setEditAmount(tx.amount);
    setEditDescription(tx.description);
    setEditCategory(tx.category);
    setEditDialogOpen(true);
  };

  const confirmEditTransaction = async () => {
    if (selectedTx) {
      try {
        const txRef = doc(db, 'transactions', selectedTx.id);
        await updateDoc(txRef, {
          amount: editAmount,
          description: editDescription,
          category: editCategory
        });
        toast({ title: 'Transacción actualizada', description: 'Los cambios fueron guardados correctamente.', variant: 'success' });
      } catch (error) {
        toast({ title: 'Error al editar', description: 'No se pudo actualizar la transacción.', variant: 'destructive' });
      }
      setEditDialogOpen(false);
      setSelectedTx(null);
    }
  };

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
    await addTransaction(newTransaction, userData?.name || userData?.email || 'Desconocido');
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
      <div className="flex flex-col items-center justify-center mt-8 mb-4">
        <img src="/LOGOLC.png" alt="Logo La Cautiva" className="mx-auto" style={{ width: 160, height: 160, objectFit: 'contain' }} />
        <h2 className="mt-4 text-4xl font-extrabold tracking-wide text-center">LA CAUTIVA</h2>
        {isAdmin && (
          <button
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg text-lg font-semibold hover:bg-blue-700 transition"
            onClick={handleOpenAuditoria}
          >
            Auditoría
          </button>
        )}
      </div>
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
          <div className="overflow-x-auto">
            <Table className="text-lg">
              <thead>
                <tr className="bg-blue-100">
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Monto</th>
                  <th className="px-4 py-3">Descripción</th>
                  <th className="px-4 py-3">Categoría</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 10).map((tx, idx) => (
                  <tr key={tx.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-blue-50'}>
                    <td className="px-4 py-3">{tx.date ? new Date(tx.date).toLocaleString() : ''}</td>
                    <td className="px-4 py-3">{tx.type === 'deposit' ? 'Depósito' : 'Gasto'}</td>
                    <td className="px-4 py-3 font-bold">{tx.amount}</td>
                    <td className="px-4 py-3">{tx.description}</td>
                    <td className="px-4 py-3">{tx.category}</td>
                    <td className="px-4 py-3">
                      {isAdmin && (
                        <>
                          <button className="text-blue-700 bg-blue-100 rounded px-3 py-1 mr-2 text-lg font-semibold hover:bg-blue-200" onClick={() => handleEditTransaction(tx)}>Editar</button>
                          <button className="text-red-700 bg-red-100 rounded px-3 py-1 text-lg font-semibold hover:bg-red-200" onClick={() => handleDeleteTransaction(tx.id)}>Eliminar</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <TransactionForm
        key={dialogType}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        type={dialogType}
        onSubmit={handleAddTransaction}
      />

      <UIDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <Card className="w-full max-w-md sm:max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Confirmar eliminación</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg text-center mb-6">¿Estás seguro que deseas eliminar esta transacción?</p>
            <div className="flex justify-center gap-4">
              <button className="px-6 py-2 bg-red-600 text-white rounded-lg text-lg font-semibold hover:bg-red-700" onClick={confirmDeleteTransaction}>Eliminar</button>
              <button className="px-6 py-2 bg-gray-400 text-white rounded-lg text-lg font-semibold hover:bg-gray-500" onClick={() => setDeleteDialogOpen(false)}>Cancelar</button>
            </div>
          </CardContent>
        </Card>
      </UIDialog>

      <UIDialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <Card className="w-full max-w-md sm:max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Editar transacción</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={e => { e.preventDefault(); confirmEditTransaction(); }} className="flex flex-col gap-4">
              <label className="text-lg font-semibold">Monto
                <input type="number" className="w-full border rounded px-3 py-2 mt-1 text-lg" value={editAmount} onChange={e => setEditAmount(Number(e.target.value))} required />
              </label>
              <label className="text-lg font-semibold">Descripción
                <input type="text" className="w-full border rounded px-3 py-2 mt-1 text-lg" value={editDescription} onChange={e => setEditDescription(e.target.value)} required />
              </label>
              <label className="text-lg font-semibold">Categoría
                <input type="text" className="w-full border rounded px-3 py-2 mt-1 text-lg" value={editCategory} onChange={e => setEditCategory(e.target.value)} required />
              </label>
              <div className="flex justify-center gap-4 mt-2">
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg text-lg font-semibold hover:bg-blue-700">Guardar</button>
                <button type="button" className="px-6 py-2 bg-gray-400 text-white rounded-lg text-lg font-semibold hover:bg-gray-500" onClick={() => setEditDialogOpen(false)}>Cancelar</button>
              </div>
            </form>
          </CardContent>
        </Card>
      </UIDialog>

      <UIDialog open={auditoriaOpen} onOpenChange={setAuditoriaOpen}>
        <Card className="w-full max-w-5xl sm:max-w-5xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center">Auditoría de Movimientos</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAuditoria ? (
              <div className="text-xl text-center py-8">Cargando...</div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="text-lg">
                  <thead>
                    <tr className="bg-blue-100">
                      <th className="px-4 py-3">Fecha</th>
                      <th className="px-4 py-3">Usuario</th>
                      <th className="px-4 py-3">Acción</th>
                      <th className="px-4 py-3">Monto</th>
                      <th className="px-4 py-3">Descripción</th>
                      <th className="px-4 py-3">Categoría</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditoria.map((row, idx) => (
                      <tr key={row.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-blue-50'}>
                        <td className="px-4 py-3 font-semibold">{row.fecha?.seconds ? new Date(row.fecha.seconds * 1000).toLocaleString() : ''}</td>
                        <td className="px-4 py-3">{row.usuario}</td>
                        <td className="px-4 py-3">{row.accion}</td>
                        <td className="px-4 py-3 font-bold">{row.detalles?.amount}</td>
                        <td className="px-4 py-3">{row.detalles?.description}</td>
                        <td className="px-4 py-3">{row.detalles?.category}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
            <div className="flex justify-end mt-6 sticky bottom-0 bg-white pt-4 pb-2 z-10">
              <button className="px-6 py-3 bg-gray-400 text-white rounded-lg text-xl font-bold hover:bg-gray-500 w-full sm:w-auto" onClick={() => setAuditoriaOpen(false)}>Cerrar</button>
            </div>
          </CardContent>
        </Card>
      </UIDialog>
    </div>
  );
}
