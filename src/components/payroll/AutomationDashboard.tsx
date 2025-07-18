
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BulkPayrollOperations } from './BulkPayrollOperations';
import { AuditLogs } from './AuditLogs';
import { EmailQueue } from './EmailQueue';
import { EmailNotifications } from './EmailNotifications';
import { LeaveCalendar } from './LeaveCalendar';
import { WeeklyOffScheduler } from './WeeklyOffScheduler';
import { FormulaMonitoringDashboard } from './FormulaMonitoringDashboard';
import { BulkLeaveApplicationSystem } from './BulkLeaveApplicationSystem';
import { SystemInitializer } from './SystemInitializer';
import { DataIntegrityValidator } from './DataIntegrityValidator';
import { Bot, Shield, Mail, Calendar, CalendarDays, Bell, Clock, Activity, FileText, Settings, Database } from 'lucide-react';

export const AutomationDashboard = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Bot className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Payroll Automation</h1>
          <p className="text-muted-foreground">
            Advanced automation features for efficient payroll management
          </p>
        </div>
      </div>

      <Tabs defaultValue="system-init" className="w-full">
        <TabsList className="grid w-full grid-cols-5 lg:grid-cols-10">
          <TabsTrigger value="system-init" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Setup
          </TabsTrigger>
          <TabsTrigger value="data-validator" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Validator
          </TabsTrigger>
          <TabsTrigger value="bulk-operations" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Bulk Ops
          </TabsTrigger>
          <TabsTrigger value="weekly-off" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Weekly Off
          </TabsTrigger>
          <TabsTrigger value="bulk-leave" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Bulk Leave
          </TabsTrigger>
          <TabsTrigger value="formula-monitoring" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Formulas
          </TabsTrigger>
          <TabsTrigger value="leave-calendar" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="email-notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notify
          </TabsTrigger>
          <TabsTrigger value="email-queue" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="audit-logs" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Audit
          </TabsTrigger>
        </TabsList>

        <TabsContent value="system-init" className="mt-6">
          <SystemInitializer />
        </TabsContent>

        <TabsContent value="data-validator" className="mt-6">
          <DataIntegrityValidator />
        </TabsContent>

        <TabsContent value="bulk-operations" className="mt-6">
          <BulkPayrollOperations />
        </TabsContent>

        <TabsContent value="weekly-off" className="mt-6">
          <WeeklyOffScheduler />
        </TabsContent>

        <TabsContent value="bulk-leave" className="mt-6">
          <BulkLeaveApplicationSystem />
        </TabsContent>

        <TabsContent value="formula-monitoring" className="mt-6">
          <FormulaMonitoringDashboard />
        </TabsContent>

        <TabsContent value="leave-calendar" className="mt-6">
          <LeaveCalendar />
        </TabsContent>

        <TabsContent value="email-notifications" className="mt-6">
          <EmailNotifications />
        </TabsContent>

        <TabsContent value="email-queue" className="mt-6">
          <EmailQueue />
        </TabsContent>

        <TabsContent value="audit-logs" className="mt-6">
          <AuditLogs />
        </TabsContent>
      </Tabs>
    </div>
  );
};
