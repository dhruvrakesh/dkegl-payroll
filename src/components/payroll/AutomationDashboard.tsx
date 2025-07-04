
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BulkPayrollOperations } from './BulkPayrollOperations';
import { AuditLogs } from './AuditLogs';
import { EmailQueue } from './EmailQueue';
import { Bot, Shield, Mail, Calendar } from 'lucide-react';

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

      <Tabs defaultValue="bulk-operations" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="bulk-operations" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Bulk Operations
          </TabsTrigger>
          <TabsTrigger value="email-queue" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email Queue
          </TabsTrigger>
          <TabsTrigger value="audit-logs" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Audit Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bulk-operations" className="mt-6">
          <BulkPayrollOperations />
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
