import { db } from './firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

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
