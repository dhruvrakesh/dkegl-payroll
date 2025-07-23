
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, RefreshCw, Users, Calendar, FileText, Settings, Building, DollarSign, Clock, BarChart3, Shield, Bot } from 'lucide-react';
import { EmployeesManagement } from './payroll/EmployeesManagement';
import { AttendanceManagement } from './payroll/AttendanceManagement';
import { LeaveBalanceManagement } from './payroll/LeaveBalanceManagement';
import { OvertimeRatesManager } from './payroll/OvertimeRatesManager';
import { FormulaManagement } from './payroll/FormulaManagement';
import { PayrollSettings } from './payroll/PayrollSettings';
import { EnhancedPayrollCalculator } from './payroll/EnhancedPayrollCalculator';
import { DepartmentManagement } from './payroll/DepartmentManagement';
import { UnitsManagement } from './payroll/UnitsManagement';
import { UserManagement } from './payroll/UserManagement';
import { ReconciliationDashboard } from './payroll/ReconciliationDashboard';
import { ReconciledPayrollCalculator } from './payroll/ReconciledPayrollCalculator';
import { PanchkulaWageCalculator } from './payroll/PanchkulaWageCalculator';
import { SalaryDisbursement } from './payroll/SalaryDisbursement';
import { EnhancedSalaryDisbursement } from './payroll/EnhancedSalaryDisbursement';
import { AdvancesManagement } from './payroll/AdvancesManagement';
import { AutomationDashboard } from './payroll/AutomationDashboard';
import { WageCalculatorDashboard } from './payroll/WageCalculatorDashboard';
import { Header } from './layout/Header';

export const PayrollDashboard = () => {
  const [activeTab, setActiveTab] = useState('enhanced-calculator');

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calculator className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Payroll Management System</h1>
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
          <TabsList className="grid w-full grid-cols-6 lg:grid-cols-12 gap-1">
            <TabsTrigger value="enhanced-calculator" className="flex items-center gap-1 text-xs">
              <Calculator className="w-3 h-3" />
              Enhanced Calculator
            </TabsTrigger>
            <TabsTrigger value="reconciled-calculator" className="flex items-center gap-1 text-xs">
              <BarChart3 className="w-3 h-3" />
              Reconciled Calculator
            </TabsTrigger>
            <TabsTrigger value="panchkula-calculator" className="flex items-center gap-1 text-xs">
              <DollarSign className="w-3 h-3" />
              Panchkula Calculator
            </TabsTrigger>
            <TabsTrigger value="wage-calculator" className="flex items-center gap-1 text-xs">
              <Clock className="w-3 h-3" />
              Wage Calculator
            </TabsTrigger>
            <TabsTrigger value="employees" className="flex items-center gap-1 text-xs">
              <Users className="w-3 h-3" />
              Employees
            </TabsTrigger>
            <TabsTrigger value="departments" className="flex items-center gap-1 text-xs">
              <Building className="w-3 h-3" />
              Departments
            </TabsTrigger>
            <TabsTrigger value="units" className="flex items-center gap-1 text-xs">
              <Building className="w-3 h-3" />
              Units
            </TabsTrigger>
            <TabsTrigger value="attendance" className="flex items-center gap-1 text-xs">
              <Calendar className="w-3 h-3" />
              Attendance
            </TabsTrigger>
            <TabsTrigger value="leaves" className="flex items-center gap-1 text-xs">
              <FileText className="w-3 h-3" />
              Leaves
            </TabsTrigger>
            <TabsTrigger value="reconciliation" className="flex items-center gap-1 text-xs">
              <BarChart3 className="w-3 h-3" />
              Reconciliation
            </TabsTrigger>
            <TabsTrigger value="salary-disbursement" className="flex items-center gap-1 text-xs">
              <DollarSign className="w-3 h-3" />
              Salary Disbursement
            </TabsTrigger>
            <TabsTrigger value="enhanced-disbursement" className="flex items-center gap-1 text-xs">
              <DollarSign className="w-3 h-3" />
              Enhanced Disbursement
            </TabsTrigger>
          </TabsList>

          <div className="mt-4">
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="grid w-full grid-cols-5 lg:grid-cols-10 gap-1">
                <TabsTrigger value="advances" className="flex items-center gap-1 text-xs">
                  <DollarSign className="w-3 h-3" />
                  Advances
                </TabsTrigger>
                <TabsTrigger value="ot-rates" className="flex items-center gap-1 text-xs">
                  <Clock className="w-3 h-3" />
                  OT Rates
                </TabsTrigger>
                <TabsTrigger value="formulas" className="flex items-center gap-1 text-xs">
                  <Calculator className="w-3 h-3" />
                  Formulas
                </TabsTrigger>
                <TabsTrigger value="users" className="flex items-center gap-1 text-xs">
                  <Shield className="w-3 h-3" />
                  Users
                </TabsTrigger>
                <TabsTrigger value="automation" className="flex items-center gap-1 text-xs">
                  <Bot className="w-3 h-3" />
                  Automation
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center gap-1 text-xs">
                  <Settings className="w-3 h-3" />
                  Settings
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <TabsContent value="enhanced-calculator" className="space-y-4">
            <EnhancedPayrollCalculator />
          </TabsContent>

          <TabsContent value="reconciled-calculator" className="space-y-4">
            <ReconciledPayrollCalculator />
          </TabsContent>

          <TabsContent value="panchkula-calculator" className="space-y-4">
            <PanchkulaWageCalculator />
          </TabsContent>

          <TabsContent value="wage-calculator" className="space-y-4">
            <WageCalculatorDashboard />
          </TabsContent>

          <TabsContent value="employees" className="space-y-4">
            <EmployeesManagement />
          </TabsContent>

          <TabsContent value="departments" className="space-y-4">
            <DepartmentManagement />
          </TabsContent>

          <TabsContent value="units" className="space-y-4">
            <UnitsManagement />
          </TabsContent>

          <TabsContent value="attendance" className="space-y-4">
            <AttendanceManagement />
          </TabsContent>

          <TabsContent value="leaves" className="space-y-4">
            <LeaveBalanceManagement />
          </TabsContent>

          <TabsContent value="reconciliation" className="space-y-4">
            <ReconciliationDashboard />
          </TabsContent>

          <TabsContent value="salary-disbursement" className="space-y-4">
            <SalaryDisbursement />
          </TabsContent>

          <TabsContent value="enhanced-disbursement" className="space-y-4">
            <EnhancedSalaryDisbursement />
          </TabsContent>

          <TabsContent value="advances" className="space-y-4">
            <AdvancesManagement />
          </TabsContent>

          <TabsContent value="ot-rates" className="space-y-4">
            <OvertimeRatesManager />
          </TabsContent>

          <TabsContent value="formulas" className="space-y-4">
            <FormulaManagement />
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <UserManagement />
          </TabsContent>

          <TabsContent value="automation" className="space-y-4">
            <AutomationDashboard />
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <PayrollSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
