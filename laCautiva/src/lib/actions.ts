import { db } from './firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

export async function registrarAuditoria({ usuario, accion, antes, despues, eliminado }: { usuario: string, accion: string, antes?: any, despues?: any, eliminado?: any }) {
  try {
    console.log('[registrarAuditoria] Intentando registrar:', { usuario, accion, antes, despues, eliminado });
    await addDoc(collection(db, 'auditoria'), {
      usuario,
      accion,
      fecha: Timestamp.now(),
      ...(antes ? { antes } : {}),
      ...(despues ? { despues } : {}),
      ...(eliminado ? { eliminado } : {})
    });
    console.log('[registrarAuditoria] Registro exitoso en auditoria');
  } catch (error) {
    console.error('[registrarAuditoria] Error al registrar auditoría:', error);
    alert('Error al registrar auditoría: ' + (error instanceof Error ? error.message : String(error)));
  }
}
