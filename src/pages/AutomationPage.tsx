
import { AutomationDashboard } from '@/components/payroll/AutomationDashboard';
import { ProtectedRoute } from '@/components/ProtectedRoute';

const AutomationPage = () => {
  return (
    <ProtectedRoute requiredRole="admin">
      <AutomationDashboard />
    </ProtectedRoute>
  );
};

export default AutomationPage;
