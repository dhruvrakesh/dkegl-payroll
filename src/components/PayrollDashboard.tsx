
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { Header } from './layout/Header';
import { EmployeesManagement } from './payroll/EmployeesManagement';
import { AttendanceManagement } from './payroll/AttendanceManagement';
import { UnitsManagement } from './payroll/UnitsManagement';
import { AdvancesManagement } from './payroll/AdvancesManagement';
import { EnhancedSalaryDisbursement } from './payroll/EnhancedSalaryDisbursement';
import { FormulaManagement } from './payroll/FormulaManagement';
import { PayrollSettings } from './payroll/PayrollSettings';
import { AuditLogs } from './payroll/AuditLogs';
import { BulkPayrollOperations } from './payroll/BulkPayrollOperations';
import { EmailQueue } from './payroll/EmailQueue';
import { LeaveBalanceManagement } from './payroll/LeaveBalanceManagement';
import { LeaveBalanceValidator } from './payroll/LeaveBalanceValidator';
import { SundayOvertimeManager } from './payroll/SundayOvertimeManager';
import PanchkulaWageCalculator from './payroll/PanchkulaWageCalculator';
import { EmployeeCodeStatus } from './payroll/EmployeeCodeStatus';
import { AdminDashboard } from './admin/AdminDashboard';
import { Users, AlertTriangle, Coffee } from 'lucide-react';

export function PayrollDashboard() {
  const { user, profile, loading, hasRole, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('salary');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600">Please log in to access the payroll system.</p>
        </div>
      </div>
    );
  }

  if (!profile?.is_approved) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center p-8">
          <Card>
            <CardHeader>
              <CardTitle>Account Pending Approval</CardTitle>
              <CardDescription>
                Your account is pending approval from an administrator. 
                Please wait for approval before accessing the system.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Enhanced Payroll Management System</h1>
          <p className="text-muted-foreground">Comprehensive payroll management with Total Paid Days calculation, leave balance tracking, and enhanced audit trails</p>
        </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex flex-wrap w-full gap-1 h-auto p-1">
          <TabsTrigger value="salary">Salary Management</TabsTrigger>
          <TabsTrigger value="panchkula">Panchkula Calculator</TabsTrigger>
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="leave-balance">Leave Balance</TabsTrigger>
          <TabsTrigger value="leave-validation">
            <AlertTriangle className="w-4 h-4 mr-1" />
            Leave Validation
          </TabsTrigger>
          <TabsTrigger value="sunday-overtime">
            <Coffee className="w-4 h-4 mr-1" />
            Sunday Overtime
          </TabsTrigger>
          <TabsTrigger value="units">Units</TabsTrigger>
          <TabsTrigger value="advances">Advances</TabsTrigger>
          <TabsTrigger value="formulas">Formulas</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Operations</TabsTrigger>
          <TabsTrigger value="audit">Audit & Logs</TabsTrigger>
          {hasRole('admin') && (
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="salary" className="space-y-6">
          <EnhancedSalaryDisbursement />
        </TabsContent>

        <TabsContent value="panchkula" className="space-y-6">
          <PanchkulaWageCalculator />
        </TabsContent>

        <TabsContent value="employees" className="space-y-6">
          <EmployeeCodeStatus />
          <EmployeesManagement />
        </TabsContent>

        <TabsContent value="attendance" className="space-y-6">
          <AttendanceManagement />
        </TabsContent>

        <TabsContent value="leave-balance" className="space-y-6">
          <LeaveBalanceManagement />
        </TabsContent>

        <TabsContent value="leave-validation" className="space-y-6">
          <LeaveBalanceValidator />
        </TabsContent>

        <TabsContent value="sunday-overtime" className="space-y-6">
          <SundayOvertimeManager />
        </TabsContent>

        <TabsContent value="units" className="space-y-6">
          <UnitsManagement />
        </TabsContent>

        <TabsContent value="advances" className="space-y-6">
          <AdvancesManagement />
        </TabsContent>

        <TabsContent value="formulas" className="space-y-6">
          <FormulaManagement />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <PayrollSettings />
        </TabsContent>

        <TabsContent value="bulk" className="space-y-6">
          <BulkPayrollOperations />
          <EmailQueue />
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          <AuditLogs />
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <AdminDashboard />
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}
