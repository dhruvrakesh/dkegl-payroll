
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, AlertTriangle, RefreshCw, Database, Users, Calendar } from 'lucide-react';

interface ValidationResult {
  category: string;
  checks: Array<{
    name: string;
    status: 'pass' | 'warning' | 'fail';
    message: string;
    count?: number;
    action?: string;
  }>;
}

export const DataIntegrityValidator = () => {
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    runValidation();
  }, []);

  const runValidation = async () => {
    setLoading(true);
    const results: ValidationResult[] = [];

    try {
      // Employee Data Validation
      const employeeChecks = await validateEmployeeData();
      results.push({
        category: 'Employee Data',
        checks: employeeChecks
      });

      // Attendance Data Validation
      const attendanceChecks = await validateAttendanceData();
      results.push({
        category: 'Attendance Data',
        checks: attendanceChecks
      });

      // Leave Balance Validation
      const leaveChecks = await validateLeaveData();
      results.push({
        category: 'Leave Management',
        checks: leaveChecks
      });

      // System Configuration Validation
      const systemChecks = await validateSystemConfig();
      results.push({
        category: 'System Configuration',
        checks: systemChecks
      });

      setValidationResults(results);
    } catch (error) {
      console.error('Validation error:', error);
      toast({
        title: "Validation Error",
        description: "Failed to complete data integrity validation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const validateEmployeeData = async () => {
    const checks = [];

    // Check for active employees
    const { data: employees, error } = await supabase
      .from('payroll_employees')
      .select('id, name, employee_code, uan_number, active')
      .eq('active', true);

    if (error) {
      checks.push({
        name: 'Employee Data Access',
        status: 'fail' as const,
        message: 'Failed to access employee data'
      });
    } else {
      checks.push({
        name: 'Active Employees',
        status: 'pass' as const,
        message: `${employees.length} active employees found`,
        count: employees.length
      });

      // Check for missing employee codes
      const missingCodes = employees.filter(emp => !emp.employee_code);
      if (missingCodes.length > 0) {
        checks.push({
          name: 'Employee Codes',
          status: 'warning' as const,
          message: `${missingCodes.length} employees missing employee codes`,
          action: 'Generate missing codes'
        });
      } else {
        checks.push({
          name: 'Employee Codes',
          status: 'pass' as const,
          message: 'All employees have valid codes'
        });
      }

      // Check for duplicate UAN numbers
      const uanNumbers = employees.filter(emp => emp.uan_number).map(emp => emp.uan_number);
      const duplicateUANs = uanNumbers.filter((uan, index) => uanNumbers.indexOf(uan) !== index);
      if (duplicateUANs.length > 0) {
        checks.push({
          name: 'UAN Numbers',
          status: 'warning' as const,
          message: `${duplicateUANs.length} duplicate UAN numbers found`,
          action: 'Review and fix duplicates'
        });
      } else {
        checks.push({
          name: 'UAN Numbers',
          status: 'pass' as const,
          message: 'No duplicate UAN numbers found'
        });
      }
    }

    return checks;
  };

  const validateAttendanceData = async () => {
    const checks = [];
    const currentMonth = new Date().toISOString().slice(0, 7);

    // Check attendance records for current month
    const { data: attendance, error } = await supabase
      .from('attendance')
      .select('employee_id, attendance_date, hours_worked, overtime_hours')
      .gte('attendance_date', `${currentMonth}-01`)
      .lt('attendance_date', `${currentMonth}-32`);

    if (error) {
      checks.push({
        name: 'Attendance Data Access',
        status: 'fail' as const,
        message: 'Failed to access attendance data'
      });
    } else {
      checks.push({
        name: 'Current Month Attendance',
        status: 'pass' as const,
        message: `${attendance.length} attendance records for current month`,
        count: attendance.length
      });

      // Check for invalid hours
      const invalidHours = attendance.filter(att => 
        att.hours_worked < 0 || att.hours_worked > 24 || 
        att.overtime_hours < 0 || att.overtime_hours > 24
      );

      if (invalidHours.length > 0) {
        checks.push({
          name: 'Hours Validation',
          status: 'warning' as const,
          message: `${invalidHours.length} records with invalid hours`,
          action: 'Review and correct hours'
        });
      } else {
        checks.push({
          name: 'Hours Validation',
          status: 'pass' as const,
          message: 'All attendance hours are valid'
        });
      }
    }

    return checks;
  };

  const validateLeaveData = async () => {
    const checks = [];
    const currentYear = new Date().getFullYear();

    // Check leave balances for current year
    const { data: balances, error } = await supabase
      .from('employee_leave_balances')
      .select('employee_id, casual_leave_balance, earned_leave_balance')
      .eq('year', currentYear);

    if (error) {
      checks.push({
        name: 'Leave Balance Access',
        status: 'fail' as const,
        message: 'Failed to access leave balance data'
      });
    } else {
      checks.push({
        name: 'Current Year Balances',
        status: 'pass' as const,
        message: `${balances.length} employees have leave balances`,
        count: balances.length
      });

      // Check for negative balances
      const negativeBalances = balances.filter(bal => 
        bal.casual_leave_balance < 0 || bal.earned_leave_balance < 0
      );

      if (negativeBalances.length > 0) {
        checks.push({
          name: 'Negative Balances',
          status: 'warning' as const,
          message: `${negativeBalances.length} employees with negative leave balances`,
          action: 'Review leave calculations'
        });
      } else {
        checks.push({
          name: 'Negative Balances',
          status: 'pass' as const,
          message: 'No negative leave balances found'
        });
      }
    }

    return checks;
  };

  const validateSystemConfig = async () => {
    const checks = [];

    // Check units configuration
    const { data: units, error: unitsError } = await supabase
      .from('units')
      .select('unit_id, unit_name, unit_code');

    if (unitsError) {
      checks.push({
        name: 'Units Configuration',
        status: 'fail' as const,
        message: 'Failed to access units configuration'
      });
    } else {
      checks.push({
        name: 'Units Configuration',
        status: 'pass' as const,
        message: `${units.length} units configured`,
        count: units.length
      });
    }

    // Check weekly off rules
    const { data: weeklyRules, error: weeklyError } = await supabase
      .from('weekly_off_rules')
      .select('unit_id')
      .eq('is_active', true);

    if (weeklyError) {
      checks.push({
        name: 'Weekly Off Rules',
        status: 'fail' as const,
        message: 'Failed to access weekly off rules'
      });
    } else {
      const unitsWithRules = new Set(weeklyRules.map(rule => rule.unit_id));
      const unitsWithoutRules = units.filter(unit => !unitsWithRules.has(unit.unit_id));

      if (unitsWithoutRules.length > 0) {
        checks.push({
          name: 'Weekly Off Rules',
          status: 'warning' as const,
          message: `${unitsWithoutRules.length} units missing weekly off rules`,
          action: 'Configure weekly off rules'
        });
      } else {
        checks.push({
          name: 'Weekly Off Rules',
          status: 'pass' as const,
          message: 'All units have weekly off rules configured'
        });
      }
    }

    return checks;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'fail': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'fail': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return null;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Employee Data': return <Users className="w-5 h-5" />;
      case 'Attendance Data': return <Calendar className="w-5 h-5" />;
      case 'Leave Management': return <Calendar className="w-5 h-5" />;
      case 'System Configuration': return <Database className="w-5 h-5" />;
      default: return <Database className="w-5 h-5" />;
    }
  };

  const overallStatus = validationResults.length > 0 
    ? validationResults.every(result => 
        result.checks.every(check => check.status === 'pass')
      ) ? 'pass' 
      : validationResults.some(result => 
          result.checks.some(check => check.status === 'fail')
        ) ? 'fail' 
      : 'warning'
    : 'unknown';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Database className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Data Integrity Validator</h2>
            <p className="text-muted-foreground">
              Comprehensive validation of payroll system data integrity
            </p>
          </div>
        </div>
        <Button onClick={runValidation} disabled={loading} className="flex items-center gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Validating...' : 'Run Validation'}
        </Button>
      </div>

      {/* Overall Status */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            {getStatusIcon(overallStatus)}
            <div>
              <div className="text-lg font-semibold">
                Overall Status: {overallStatus === 'pass' ? 'Healthy' : overallStatus === 'warning' ? 'Needs Attention' : 'Critical Issues'}
              </div>
              <div className="text-sm text-muted-foreground">
                System validation completed at {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validation Results */}
      {validationResults.map((result) => (
        <Card key={result.category}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getCategoryIcon(result.category)}
              {result.category}
            </CardTitle>
            <CardDescription>
              {result.checks.length} validation checks performed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {result.checks.map((check, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(check.status)}
                    <div>
                      <div className="font-medium">{check.name}</div>
                      <div className="text-sm text-muted-foreground">{check.message}</div>
                      {check.action && (
                        <div className="text-sm text-blue-600 mt-1">
                          Recommended action: {check.action}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(check.status)}>
                      {check.status.toUpperCase()}
                    </Badge>
                    {check.count && (
                      <div className="text-sm text-muted-foreground">
                        {check.count}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
