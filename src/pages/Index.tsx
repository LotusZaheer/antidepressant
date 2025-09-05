import { AuthProvider, useAuth } from '@/components/AuthProvider';
import { LoginForm } from '@/components/LoginForm';
import { MedicationDashboard } from '@/components/MedicationDashboard';

const AppContent = () => {
  const { user } = useAuth();
  
  // For demo purposes, allow guest access to view data
  if (!user) {
    return <LoginForm />;
  }
  
  return <MedicationDashboard />;
};

const Index = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default Index;
