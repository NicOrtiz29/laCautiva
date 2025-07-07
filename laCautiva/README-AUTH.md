# Configuración de Autenticación - Gestor del Centro de Jubilados "LA CAUTIVA"

## 🚀 Configuración Inicial

### 1. Configurar Firebase

El proyecto ya está configurado con Firebase. Las credenciales están en `src/lib/firebase.ts`.

### 2. Crear Usuarios Iniciales

Ejecuta el script para crear los usuarios iniciales:

```bash
cd laCautiva
node scripts/setup-users.js
```

### 3. Credenciales de Acceso

Después de ejecutar el script, tendrás acceso con:

#### 👨‍💼 Administrador
- **Email:** admin@lacautiva.com
- **Contraseña:** admin123456
- **Permisos:** Puede agregar, editar y eliminar transacciones

#### 👁️ Visualizador
- **Email:** viewer@lacautiva.com
- **Contraseña:** viewer123456
- **Permisos:** Solo puede ver las transacciones y reportes

## 🔐 Funcionalidades de Autenticación

### Características Implementadas:

1. **Sistema de Login/Logout**
   - Formulario de inicio de sesión con validación
   - Manejo de errores específicos de Firebase
   - Botón de cerrar sesión en el dashboard

2. **Control de Roles**
   - **Administrador:** Acceso completo a todas las funciones
   - **Visualizador:** Solo puede ver datos, no puede editar

3. **Protección de Rutas**
   - Todas las páginas requieren autenticación
   - Verificación de roles para funciones administrativas

4. **Persistencia de Datos**
   - Las transacciones se guardan en Firestore
   - Sincronización en tiempo real
   - Datos de usuario almacenados en Firestore

### Estructura de Base de Datos

#### Colección: `users`
```javascript
{
  uid: "user-id",
  email: "user@example.com",
  name: "Nombre del Usuario",
  role: "admin" | "viewer",
  createdAt: "2024-01-01T00:00:00.000Z"
}
```

#### Colección: `transactions`
```javascript
{
  id: "transaction-id",
  type: "deposit" | "expense",
  amount: 1000,
  description: "Descripción de la transacción",
  date: "2024-01-01T00:00:00.000Z"
}
```

## 🛠️ Configuración de Firebase

### Habilitar Servicios

En la consola de Firebase, asegúrate de tener habilitados:

1. **Authentication**
   - Método: Email/Password
   - Dominios autorizados configurados

2. **Firestore Database**
   - Reglas de seguridad configuradas
   - Índices creados si es necesario

### Reglas de Seguridad de Firestore

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuarios pueden leer sus propios datos
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
    }
    
    // Transacciones: solo usuarios autenticados pueden leer
    match /transactions/{transactionId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

## 🔧 Comandos Útiles

### Levantar el proyecto
```bash
npm run dev
```

### Configurar usuarios (solo una vez)
```bash
node scripts/setup-users.js
```

### Verificar configuración
```bash
npm run typecheck
```

## 📱 Uso de la Aplicación

1. **Acceder:** Ve a la aplicación y verás la pantalla de login
2. **Iniciar sesión:** Usa las credenciales del administrador o visualizador
3. **Navegar:** El dashboard mostrará diferentes opciones según tu rol
4. **Administrar:** Solo los administradores pueden agregar/editar transacciones
5. **Visualizar:** Todos los usuarios pueden ver reportes y gráficos

## 🔒 Seguridad

- Las contraseñas se almacenan de forma segura en Firebase Authentication
- Los roles se verifican en cada operación
- Las reglas de Firestore protegen los datos
- Las sesiones se manejan automáticamente

## 🆘 Solución de Problemas

### Error de autenticación
- Verifica que los usuarios existan en Firebase
- Ejecuta el script de configuración nuevamente

### Error de permisos
- Verifica las reglas de Firestore
- Asegúrate de que el usuario tenga el rol correcto

### Error de conexión
- Verifica la configuración de Firebase
- Revisa las credenciales en `src/lib/firebase.ts` 