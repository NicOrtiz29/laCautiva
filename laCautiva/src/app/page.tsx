import { Dashboard } from '@/components/dashboard';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function Home() {
  return (
    <ProtectedRoute>
      <main className="p-4 sm:p-6 lg:p-8">
        <Dashboard />
      </main>
    </ProtectedRoute>
  );
}
