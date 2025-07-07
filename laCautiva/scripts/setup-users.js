// Script para configurar usuarios iniciales en Firebase
// Ejecutar con: node scripts/setup-users.js

const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyCfUlYtvz16RS2TNIUglzk2ULxQ24Px52I",
  authDomain: "lacautiva-35ad9.firebaseapp.com",
  projectId: "lacautiva-35ad9",
  storageBucket: "lacautiva-35ad9.firebasestorage.app",
  messagingSenderId: "910754418427",
  appId: "1:910754418427:web:94c72abfcd00b4aa572a5e",
  measurementId: "G-1753ZPGD85"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const users = [
  {
    email: 'admin@lacautiva.com',
    password: 'admin123456',
    name: 'Administrador',
    role: 'admin'
  },
  {
    email: 'viewer@lacautiva.com',
    password: 'viewer123456',
    name: 'Visualizador',
    role: 'viewer'
  }
];

async function setupUsers() {
  console.log('🚀 Configurando usuarios en Firebase...\n');

  for (const userData of users) {
    try {
      console.log(`📝 Creando usuario: ${userData.email}`);
      
      // Crear usuario en Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        userData.email, 
        userData.password
      );
      
      const user = userCredential.user;
      console.log(`✅ Usuario creado en Authentication: ${user.uid}`);

      // Agregar datos adicionales en Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email: userData.email,
        name: userData.name,
        role: userData.role,
        createdAt: new Date().toISOString()
      });
      
      console.log(`✅ Datos de usuario agregados a Firestore`);
      console.log(`👤 Email: ${userData.email}`);
      console.log(`👤 Nombre: ${userData.name}`);
      console.log(`👤 Rol: ${userData.role}`);
      console.log('---\n');

    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log(`⚠️  El usuario ${userData.email} ya existe`);
      } else {
        console.error(`❌ Error creando usuario ${userData.email}:`, error.message);
      }
    }
  }

  console.log('🎉 Configuración completada!');
  console.log('\n📋 Credenciales de acceso:');
  console.log('👨‍💼 Administrador:');
  console.log('   Email: admin@lacautiva.com');
  console.log('   Contraseña: admin123456');
  console.log('\n👁️  Visualizador:');
  console.log('   Email: viewer@lacautiva.com');
  console.log('   Contraseña: viewer123456');
}

setupUsers().catch(console.error); 