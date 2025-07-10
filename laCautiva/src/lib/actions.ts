import {
  suggestSpendingLimits,
  type SuggestSpendingLimitsInput,
  type SuggestSpendingLimitsOutput,
} from '@/ai/flows/suggest-spending-limits';
import { db } from './firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

export async function getSpendingSuggestion(
  input: SuggestSpendingLimitsInput
): Promise<{ success: true; data: SuggestSpendingLimitsOutput } | { success: false; error: string }> {
  try {
    const result = await suggestSpendingLimits(input);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error getting spending suggestion:', error);
    return { success: false, error: 'Ocurrió un error inesperado al generar la sugerencia.' };
  }
}

export async function registrarAuditoria({ usuario, accion }: { usuario: string, accion: string }) {
  try {
    await addDoc(collection(db, 'auditoria'), {
      usuario,
      accion,
      fecha: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error al registrar auditoría:', error);
  }
}
