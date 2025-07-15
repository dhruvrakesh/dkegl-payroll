
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

export function PayrollDashboard() {
  const [activeTab, setActiveTab] = useState('salary');

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Enhanced Payroll Management System</h1>
        <p className="text-muted-foreground">Comprehensive payroll management with Total Paid Days calculation, leave balance tracking, and enhanced audit trails</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-10">
          <TabsTrigger value="salary">Salary Management</TabsTrigger>
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="leave-balance">Leave Balance</TabsTrigger>
          <TabsTrigger value="units">Units</TabsTrigger>
          <TabsTrigger value="advances">Advances</TabsTrigger>
          <TabsTrigger value="formulas">Formulas</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Operations</TabsTrigger>
          <TabsTrigger value="audit">Audit & Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="salary" className="space-y-6">
          <EnhancedSalaryDisbursement />
        </TabsContent>

        <TabsContent value="employees" className="space-y-6">
          <EmployeesManagement />
        </TabsContent>

        <TabsContent value="attendance" className="space-y-6">
          <AttendanceManagement />
        </TabsContent>

        <TabsContent value="leave-balance" className="space-y-6">
          <LeaveBalanceManagement />
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
      </Tabs>
    </div>
  );
}
