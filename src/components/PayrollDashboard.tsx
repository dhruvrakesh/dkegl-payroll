import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, RefreshCw } from 'lucide-react';
import { EmployeeManagement } from './payroll/EmployeeManagement';
import { AttendanceDashboard } from './payroll/AttendanceDashboard';
import { LeaveManagement } from './payroll/LeaveManagement';
import { OvertimeRatesManager } from './payroll/OvertimeRatesManager';
import { FormulaManagement } from './payroll/FormulaManagement';
import { PayrollSettings } from './payroll/PayrollSettings';
import { EnhancedPayrollCalculator } from './payroll/EnhancedPayrollCalculator';

export const PayrollDashboard = () => {
  const [activeTab, setActiveTab] = useState('enhanced-calculator');

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calculator className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Payroll Management</h1>
            <p className="text-muted-foreground">
              Comprehensive payroll management with enhanced formula-driven calculations
            </p>
          </div>
        </div>
        <Button onClick={() => window.location.reload()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="enhanced-calculator" className="w-full" value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="enhanced-calculator">Enhanced Calculator</TabsTrigger>
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="leaves">Leaves</TabsTrigger>
          <TabsTrigger value="ot-rates">OT Rates</TabsTrigger>
          <TabsTrigger value="formulas">Formulas</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="enhanced-calculator" className="space-y-4">
          <EnhancedPayrollCalculator />
        </TabsContent>

        <TabsContent value="employees" className="space-y-4">
          <EmployeeManagement />
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <AttendanceDashboard />
        </TabsContent>

        <TabsContent value="leaves" className="space-y-4">
          <LeaveManagement />
        </TabsContent>

        <TabsContent value="ot-rates" className="space-y-4">
          <OvertimeRatesManager />
        </TabsContent>

        <TabsContent value="formulas" className="space-y-4">
          <FormulaManagement />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <PayrollSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};
