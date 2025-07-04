
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/layout/Header';
import { UnitsManagement } from './payroll/UnitsManagement';
import { EmployeesManagement } from './payroll/EmployeesManagement';
import { AttendanceManagement } from './payroll/AttendanceManagement';
import { AdvancesManagement } from './payroll/AdvancesManagement';
import { SalaryDisbursement } from './payroll/SalaryDisbursement';
import { PayrollSettings } from './payroll/PayrollSettings';
import { Building2, Users, Clock, DollarSign, Calculator, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export const PayrollDashboard = () => {
  const { profile, hasRole } = useAuth();

  const canViewUnits = hasRole('admin');
  const canViewEmployees = hasRole('admin') || hasRole('hr') || hasRole('manager');
  const canViewAttendance = hasRole('admin') || hasRole('hr') || hasRole('manager');
  const canViewAdvances = hasRole('admin') || hasRole('hr') || hasRole('manager');
  const canViewSalary = hasRole('admin') || hasRole('hr') || hasRole('manager');
  const canViewSettings = hasRole('admin');

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto p-6 space-y-6">
        <div className="mb-8">
          <h2 className="text-xl font-semibold tracking-tight">
            Welcome back, {profile?.full_name || profile?.email}
          </h2>
          <p className="text-muted-foreground">
            Manage employees, attendance, advances, and salary disbursements
          </p>
        </div>

        <Tabs defaultValue="employees" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            {canViewUnits && (
              <TabsTrigger value="units" className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Units
              </TabsTrigger>
            )}
            {canViewEmployees && (
              <TabsTrigger value="employees" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Employees
              </TabsTrigger>
            )}
            {canViewAttendance && (
              <TabsTrigger value="attendance" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Attendance
              </TabsTrigger>
            )}
            {canViewAdvances && (
              <TabsTrigger value="advances" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Advances
              </TabsTrigger>
            )}
            {canViewSalary && (
              <TabsTrigger value="salary" className="flex items-center gap-2">
                <Calculator className="w-4 h-4" />
                Salary
              </TabsTrigger>
            )}
            {canViewSettings && (
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Settings
              </TabsTrigger>
            )}
          </TabsList>

          {canViewUnits && (
            <TabsContent value="units">
              <Card>
                <CardHeader>
                  <CardTitle>Units Management</CardTitle>
                  <CardDescription>
                    Manage organizational units and their locations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <UnitsManagement />
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {canViewEmployees && (
            <TabsContent value="employees">
              <Card>
                <CardHeader>
                  <CardTitle>Employee Management</CardTitle>
                  <CardDescription>
                    Manage employee records, UAN numbers, and unit assignments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <EmployeesManagement />
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {canViewAttendance && (
            <TabsContent value="attendance">
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Management</CardTitle>
                  <CardDescription>
                    Track daily attendance and working hours
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AttendanceManagement />
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {canViewAdvances && (
            <TabsContent value="advances">
              <Card>
                <CardHeader>
                  <CardTitle>Advances Management</CardTitle>
                  <CardDescription>
                    Track employee advance payments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AdvancesManagement />
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {canViewSalary && (
            <TabsContent value="salary">
              <Card>
                <CardHeader>
                  <CardTitle>Salary Disbursement</CardTitle>
                  <CardDescription>
                    Calculate and manage monthly salary disbursements
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SalaryDisbursement />
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {canViewSettings && (
            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Payroll Settings</CardTitle>
                  <CardDescription>
                    Configure PF and ESI rates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PayrollSettings />
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};
