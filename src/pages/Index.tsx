import { AuthProvider } from '@/components/AuthProvider';
import { MedicationDashboard } from '@/components/MedicationDashboard';

const Index = () => {
  return (
    <AuthProvider>
      <MedicationDashboard />
    </AuthProvider>
  );
};

export default Index;
