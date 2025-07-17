"use client";

import { useState, useMemo } from 'react';
import type { Transaction } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { useTransactions } from '@/hooks/use-transactions';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PlusCircle, MinusCircle, LogOut, User, BookOpen } from 'lucide-react';
import { Dialog as UIDialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table } from '@/components/ui/table';
import { collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

import BalanceCard from '@/components/balance-card';
import TransactionForm from '@/components/transaction-form';
import TransactionsList from '@/components/transactions-list';
import MonthlySummary from '@/components/spending-suggestion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
    try {
      const snapshot = await getDocs(collection(db, 'auditoria'));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AuditoriaItem[];
      setAuditoria(
        data.sort((a, b) => {
          const fechaA = a.fecha?.seconds || 0;
          const fechaB = b.fecha?.seconds || 0;
          return fechaB - fechaA;
        })
      );
      console.log('Auditoría cargada:', data);
    } catch (error) {
      console.error('Error al cargar auditoría:', error);
      setAuditoria([]);
    }
    setLoadingAuditoria(false);
  };

  const handleOpenAuditoria = async () => {
    if (!isAdmin) return;
    console.log('Abriendo modal de auditoría...');
    await fetchAuditoria();
    setAuditoriaOpen(true);
    console.log('Modal de auditoría abierto:', auditoriaOpen);
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
        // Guardar datos del movimiento eliminado
        const eliminado = {
          amount: selectedTx.amount,
          description: selectedTx.description,
          category: selectedTx.category,
          type: selectedTx.type
        };
        await deleteTransaction(selectedTx.id);
        // Registrar auditoría
        try {
          const { registrarAuditoria } = await import('@/lib/actions');
          await registrarAuditoria({
            usuario: userData?.name || userData?.email || 'Desconocido',
            accion: `Eliminó ${selectedTx.type === 'deposit' ? 'depósito' : 'gasto'}`,
            eliminado
          });
        } catch (e) { /* noop */ }
        toast({ title: 'Transacción eliminada', description: 'La transacción fue eliminada correctamente.', variant: 'default' });
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
        // Guardar estado anterior
        const antes = {
          amount: selectedTx.amount,
          description: selectedTx.description,
          category: selectedTx.category,
          type: selectedTx.type
        };
        const despues = {
          amount: editAmount,
          description: editDescription,
          category: editCategory,
          type: selectedTx.type
        };
        const txRef = doc(db, 'transactions', selectedTx.id);
        await updateDoc(txRef, {
          amount: editAmount,
          description: editDescription,
          category: editCategory
        });
        // Registrar auditoría
        try {
          const { registrarAuditoria } = await import('@/lib/actions');
          await registrarAuditoria({
            usuario: userData?.name || userData?.email || 'Desconocido',
            accion: `Editó ${selectedTx.type === 'deposit' ? 'depósito' : 'gasto'}`,
            antes,
            despues
          });
        } catch (e) { /* noop */ }
        toast({ title: 'Transacción actualizada', description: 'Los cambios fueron guardados correctamente.', variant: 'default' });
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
    if (!isAdmin) return;
    const newTransaction = {
      type: dialogType,
      amount: data.amount,
      description: data.description,
      category: data.category,
      date: new Date().toISOString(),
    };
    await addTransaction(newTransaction, userData?.name || userData?.email || 'Desconocido');
    // Registrar auditoría
    try {
      const { registrarAuditoria } = await import('@/lib/actions');
      await registrarAuditoria({
        usuario: userData?.name || userData?.email || 'Desconocido',
        accion: `Agregó ${dialogType === 'deposit' ? 'depósito' : 'gasto'}`,
        agregado: {
          amount: data.amount,
          description: data.description,
          category: data.category,
          type: dialogType
        }
      });
    } catch (e) { /* noop */ }
  };

  // Refuerzo: Solo el admin puede abrir el formulario de transacciones
  const handleOpenDialog = (type: 'deposit' | 'expense') => {
    if (!isAdmin) return;
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

  // Categorías predefinidas según el tipo de transacción
  const categories = dialogType === 'deposit'
    ? [
        { value: 'cuota', label: 'Cuota Mensual' },
        { value: 'donacion', label: 'Donación' },
        { value: 'subvencion', label: 'Subvención' },
        { value: 'evento', label: 'Evento' },
        { value: 'viajes', label: 'Viajes' },
        { value: 'otros_ingresos', label: 'Otros Ingresos' }
      ]
    : [
        { value: 'viajes', label: 'Viajes' },
        { value: 'mantenimiento', label: 'Mantenimiento' },
        { value: 'limpieza', label: 'Limpieza' },
        { value: 'construccion', label: 'Construcción' },
        { value: 'otros', label: 'Otros' }
      ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center justify-center mt-8 mb-4">
        {/* <img src="/LOGOLC.png" alt="Logo La Cautiva" className="mx-auto" style={{ width: 160, height: 160, objectFit: 'contain' }} /> */}
        {/* <h2 className="mt-4 text-4xl font-extrabold tracking-wide text-center">LA CAUTIVA</h2> */}
        {/* Botón de Auditoría eliminado de aquí */}
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
        <div className="flex flex-wrap gap-2 w-full sm:w-auto sm:flex-nowrap sm:items-center sm:justify-end">
          {isAdmin && (
            <>
              <Button onClick={() => handleOpenDialog('deposit')} className="bg-accent hover:bg-accent/90 text-accent-foreground w-full sm:w-auto">
                <PlusCircle className="mr-2 h-4 w-4" />
                Añadir Depósito
              </Button>
              <Button variant="destructive" onClick={() => handleOpenDialog('expense')} className="w-full sm:w-auto">
                <MinusCircle className="mr-2 h-4 w-4" />
                Añadir Gasto
              </Button>
              <Button className="bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2 w-full sm:w-auto" onClick={handleOpenAuditoria}>
                <BookOpen className="w-5 h-5" /> Auditoría
              </Button>
            </>
          )}
          <Button variant="outline" onClick={handleLogout} className="w-full sm:w-auto">
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

      {/* Mensaje para usuarios comunes */}
      {!isAdmin && (
        <div className="p-4 my-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 rounded">
          <b>Solo lectura:</b> Tu cuenta solo permite visualizar la información. Si necesitas cargar movimientos o acceder a la auditoría, contacta a un administrador.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Transacciones Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table className="text-lg">
              <thead>
                <tr className="bg-blue-100">
                  <th className="px-4 py-3 text-center">Fecha</th>
                  <th className="px-4 py-3 text-center">Tipo</th>
                  <th className="px-4 py-3 text-center">Monto</th>
                  <th className="px-4 py-3 text-center">Descripción</th>
                  <th className="px-4 py-3 text-center">Categoría</th>
                  {isAdmin && (
                    <th className="px-4 py-3 text-right">Acción</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 10).map((tx, idx) => (
                  <tr key={tx.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-blue-50'}>
                    <td className="px-4 py-3 text-center">{tx.date ? new Date(tx.date).toLocaleString() : ''}</td>
                    <td className="px-4 py-3 text-center">{tx.type === 'deposit' ? 'Depósito' : 'Gasto'}</td>
                    <td className="px-4 py-3 font-bold text-center">{tx.amount}</td>
                    <td className="px-4 py-3 text-center">{tx.description}</td>
                    <td className="px-4 py-3 text-center">{tx.category}</td>
                    {isAdmin && (
                      <td className="px-4 py-3 text-right">
                        <button className="text-blue-700 bg-blue-100 rounded px-3 py-1 mr-2 text-lg font-semibold hover:bg-blue-200" onClick={() => handleEditTransaction(tx)}>Editar</button>
                        <button className="text-red-700 bg-red-100 rounded px-3 py-1 text-lg font-semibold hover:bg-red-200" onClick={() => handleDeleteTransaction(tx.id)}>Eliminar</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <TransactionForm
        key={dialogType}
        open={dialogOpen && isAdmin} // Solo admin puede abrir
        onOpenChange={setDialogOpen}
        type={dialogType}
        onSubmit={handleAddTransaction}
      />

      {/* Modales solo se renderizan si están abiertos */}
      <UIDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">Confirmar eliminación</DialogTitle>
          </DialogHeader>
          <p className="text-lg text-center mb-6">¿Estás seguro que deseas eliminar esta transacción?</p>
          <div className="flex justify-center gap-4">
            <button className="px-6 py-2 bg-red-600 text-white rounded-lg text-lg font-semibold hover:bg-red-700" onClick={confirmDeleteTransaction}>Eliminar</button>
            <button className="px-6 py-2 bg-gray-400 text-white rounded-lg text-lg font-semibold hover:bg-gray-500" onClick={() => setDeleteDialogOpen(false)}>Cancelar</button>
          </div>
        </DialogContent>
      </UIDialog>

      <UIDialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">Editar transacción</DialogTitle>
          </DialogHeader>
          <form onSubmit={e => { e.preventDefault(); confirmEditTransaction(); }} className="flex flex-col gap-4">
            <label className="text-lg font-semibold">Monto
              <input type="number" className="w-full border rounded px-3 py-2 mt-1 text-lg" value={editAmount} onChange={e => setEditAmount(Number(e.target.value))} required />
            </label>
            <label className="text-lg font-semibold">Descripción
              <input type="text" className="w-full border rounded px-3 py-2 mt-1 text-lg" value={editDescription} onChange={e => setEditDescription(e.target.value)} required />
            </label>
            <label className="text-lg font-semibold">Categoría
              <Select value={editCategory} onValueChange={setEditCategory}>
                <SelectTrigger className="w-full border rounded px-3 py-2 mt-1 text-lg">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <div className="flex justify-center gap-4 mt-2">
              <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg text-lg font-semibold hover:bg-blue-700">Guardar</button>
              <button type="button" className="px-6 py-2 bg-gray-400 text-white rounded-lg text-lg font-semibold hover:bg-gray-500" onClick={() => setEditDialogOpen(false)}>Cancelar</button>
            </div>
          </form>
        </DialogContent>
      </UIDialog>

      <UIDialog open={auditoriaOpen && isAdmin} onOpenChange={setAuditoriaOpen}>
        <DialogContent className="w-full max-w-5xl sm:max-w-5xl mx-auto max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-3xl font-bold text-center">Auditoría de Movimientos</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            {loadingAuditoria ? (
              <div className="text-xl text-center py-8">Cargando...</div>
            ) : auditoria.length === 0 ? (
              <div className="text-xl text-center py-8 text-gray-500">No hay registros de auditoría.</div>
            ) : (
              <>
                {/* Tabla para desktop */}
                <div className="hidden md:block">
                  <Table className="text-lg">
                    <thead className="sticky top-0">
                      <tr className="bg-blue-100">
                        <th className="px-4 py-3">Fecha</th>
                        <th className="px-4 py-3">Usuario</th>
                        <th className="px-4 py-3">Acción</th>
                        <th className="px-4 py-3">Antes</th>
                        <th className="px-4 py-3">Después</th>
                        <th className="px-4 py-3">Eliminado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditoria.map((row, idx) => (
                        <tr key={row.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-blue-50'}>
                          <td className="px-4 py-3 font-semibold">{row.fecha?.seconds ? new Date(row.fecha.seconds * 1000).toLocaleString() : ''}</td>
                          <td className="px-4 py-3">{row.usuario}</td>
                          <td className="px-4 py-3">{row.accion}</td>
                          <td className="px-4 py-3">
                            {row.antes ? (
                              <div>
                                <div><b>Monto:</b> {row.antes.amount}</div>
                                <div><b>Descripción:</b> {row.antes.description}</div>
                                <div><b>Categoría:</b> {row.antes.category}</div>
                                <div><b>Tipo:</b> {row.antes.type}</div>
                              </div>
                            ) : ''}
                          </td>
                          <td className="px-4 py-3">
                            {row.despues ? (
                              <div>
                                <div><b>Monto:</b> {row.despues.amount}</div>
                                <div><b>Descripción:</b> {row.despues.description}</div>
                                <div><b>Categoría:</b> {row.despues.category}</div>
                                <div><b>Tipo:</b> {row.despues.type}</div>
                              </div>
                            ) : ''}
                          </td>
                          <td className="px-4 py-3">
                            {row.eliminado ? (
                              <div>
                                <div><b>Monto:</b> {row.eliminado.amount}</div>
                                <div><b>Descripción:</b> {row.eliminado.description}</div>
                                <div><b>Categoría:</b> {row.eliminado.category}</div>
                                <div><b>Tipo:</b> {row.eliminado.type}</div>
                              </div>
                            ) : ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
                {/* Cards para mobile */}
                <div className="block md:hidden space-y-4 p-4">
                  {auditoria.map((row) => (
                    <div key={row.id} className="bg-white rounded-lg shadow border p-4">
                      <div className="text-xs text-gray-500 mb-1">{row.fecha?.seconds ? new Date(row.fecha.seconds * 1000).toLocaleString() : ''}</div>
                      <div className="font-bold text-base mb-1">{row.usuario}</div>
                      <div className="mb-2"><span className="font-semibold">Acción:</span> {row.accion}</div>
                      {row.antes && (
                        <div className="mb-2">
                          <div className="font-semibold text-sm mb-1">Antes:</div>
                          <div className="text-xs"><b>Monto:</b> {row.antes.amount}</div>
                          <div className="text-xs"><b>Descripción:</b> {row.antes.description}</div>
                          <div className="text-xs"><b>Categoría:</b> {row.antes.category}</div>
                          <div className="text-xs"><b>Tipo:</b> {row.antes.type}</div>
                        </div>
                      )}
                      {row.despues && (
                        <div className="mb-2">
                          <div className="font-semibold text-sm mb-1">Después:</div>
                          <div className="text-xs"><b>Monto:</b> {row.despues.amount}</div>
                          <div className="text-xs"><b>Descripción:</b> {row.despues.description}</div>
                          <div className="text-xs"><b>Categoría:</b> {row.despues.category}</div>
                          <div className="text-xs"><b>Tipo:</b> {row.despues.type}</div>
                        </div>
                      )}
                      {row.eliminado && (
                        <div className="mb-2">
                          <div className="font-semibold text-sm mb-1">Eliminado:</div>
                          <div className="text-xs"><b>Monto:</b> {row.eliminado.amount}</div>
                          <div className="text-xs"><b>Descripción:</b> {row.eliminado.description}</div>
                          <div className="text-xs"><b>Categoría:</b> {row.eliminado.category}</div>
                          <div className="text-xs"><b>Tipo:</b> {row.eliminado.type}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="flex justify-end mt-6 flex-shrink-0 pt-4 pb-2 z-10">
            <button className="px-6 py-3 bg-gray-400 text-white rounded-lg text-xl font-bold hover:bg-gray-500 w-full sm:w-auto" onClick={() => setAuditoriaOpen(false)}>Cerrar</button>
          </div>
        </DialogContent>
      </UIDialog>
    </div>
  );
}
