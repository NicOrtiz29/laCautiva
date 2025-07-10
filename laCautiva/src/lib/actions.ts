import { db } from './firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

export async function registrarAuditoria({ usuario, accion, antes, despues }: { usuario: string, accion: string, antes?: any, despues?: any }) {
  try {
    console.log('[registrarAuditoria] Intentando registrar:', { usuario, accion, antes, despues });
    await addDoc(collection(db, 'auditoria'), {
      usuario,
      accion,
      fecha: Timestamp.now(),
      ...(antes ? { antes } : {}),
      ...(despues ? { despues } : {})
    });
    console.log('[registrarAuditoria] Registro exitoso en auditoria');
  } catch (error) {
    console.error('[registrarAuditoria] Error al registrar auditoría:', error);
    alert('Error al registrar auditoría: ' + (error instanceof Error ? error.message : String(error)));
  }
}
