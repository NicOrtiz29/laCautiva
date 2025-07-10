"use client";

import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Transaction } from '@/lib/types';
import { registrarAuditoria } from '@/lib/actions';

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar transacciones desde Firestore
  useEffect(() => {
    const q = query(collection(db, 'transactions'), orderBy('date', 'desc'));
    
          const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const transactionsData: Transaction[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          transactionsData.push({
            id: doc.id,
            type: data.type,
            amount: data.amount,
            description: data.description,
            category: data.category,
            date: data.date
          });
        });
        setTransactions(transactionsData);
        setLoading(false);
      }, (error) => {
      console.error('Error loading transactions:', error);
      setError('Error al cargar las transacciones');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Agregar nueva transacción
  const addTransaction = async (transaction: Omit<Transaction, 'id'>, usuario?: string) => {
    try {
      setError(null);
      await addDoc(collection(db, 'transactions'), {
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description,
        category: transaction.category,
        date: transaction.date
      });
      if (usuario) {
        // registrarAuditoria si está disponible
        try {
          const { registrarAuditoria } = await import('@/lib/actions');
          await registrarAuditoria({
            usuario,
            accion: `Agregó ${transaction.type === 'deposit' ? 'depósito' : 'gasto'}`,
            detalles: {
              amount: transaction.amount,
              description: transaction.description,
              category: transaction.category,
              date: transaction.date
            }
          });
        } catch (e) { /* noop */ }
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
      setError('Error al agregar la transacción');
      throw error;
    }
  };

  // Eliminar transacción
  const deleteTransaction = async (id: string) => {
    try {
      setError(null);
      await deleteDoc(doc(db, 'transactions', id));
    } catch (error) {
      console.error('Error deleting transaction:', error);
      setError('Error al eliminar la transacción');
      throw error;
    }
  };

  return {
    transactions,
    loading,
    error,
    addTransaction,
    deleteTransaction
  };
} 