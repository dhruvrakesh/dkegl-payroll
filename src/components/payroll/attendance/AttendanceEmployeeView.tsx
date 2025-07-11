
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface Attendance {
  attendance_id: string;
  employee_id: string;
  attendance_date: string;
  hours_worked: number;
  overtime_hours: number;
  payroll_employees?: { name: string };
  units?: { unit_name: string };
}

interface Employee {
  id: string;
  name: string;
}

interface AttendanceEmployeeViewProps {
  attendanceRecords: Attendance[];
  employees: Employee[];
  loading: boolean;
  onRefresh: () => void;
}

export const AttendanceEmployeeView: React.FC<AttendanceEmployeeViewProps> = ({
  attendanceRecords,
  employees,
  loading,
  onRefresh
}) => {
  const [expandedEmployees, setExpandedEmployees] = useState<Set<string>>(new Set());

  // Group attendance by employee
  const attendanceByEmployee = new Map();
  attendanceRecords.forEach(record => {
    const empId = record.employee_id;
    if (!attendanceByEmployee.has(empId)) {
      attendanceByEmployee.set(empId, []);
    }
    attendanceByEmployee.get(empId).push(record);
  });

  const toggleEmployee = (employeeId: string) => {
    const newExpanded = new Set(expandedEmployees);
    if (newExpanded.has(employeeId)) {
      newExpanded.delete(employeeId);
    } else {
      newExpanded.add(employeeId);
    }
    setExpandedEmployees(newExpanded);
  };

  const getEmployeeStats = (employeeId: string) => {
    const records = attendanceByEmployee.get(employeeId) || [];
    const totalHours = records.reduce((sum: number, r: Attendance) => sum + r.hours_worked, 0);
    const totalOvertimeHours = records.reduce((sum: number, r: Attendance) => sum + (r.overtime_hours || 0), 0);
    const totalDays = records.length;
    const averageHours = totalDays > 0 ? totalHours / totalDays : 0;
    
    return { totalHours, totalOvertimeHours, totalDays, averageHours };
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading employee data...</div>;
  }

  // Get employees with attendance records
  const employeesWithAttendance = Array.from(attendanceByEmployee.keys())
    .map(empId => {
      const employee = employees.find(e => e.id === empId);
      const records = attendanceByEmployee.get(empId);
      const empName = records[0]?.payroll_employees?.name || employee?.name || 'Unknown';
      return { id: empId, name: empName, records };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {employeesWithAttendance.length} employees with attendance records
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setExpandedEmployees(new Set(employeesWithAttendance.map(e => e.id)))}
          >
            Expand All
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setExpandedEmployees(new Set())}
          >
            Collapse All
          </Button>
        </div>
      </div>

      {employeesWithAttendance.map(employee => {
        const isExpanded = expandedEmployees.has(employee.id);
        const stats = getEmployeeStats(employee.id);
        
        return (
          <Card key={employee.id}>
            <Collapsible open={isExpanded} onOpenChange={() => toggleEmployee(employee.id)}>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                      <CardTitle className="text-lg">{employee.name}</CardTitle>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right text-sm">
                        <div className="font-medium">{stats.totalDays} days</div>
                        <div className="text-muted-foreground">{stats.totalHours.toFixed(1)}h total</div>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="secondary">
                          Avg: {stats.averageHours.toFixed(1)}h/day
                        </Badge>
                        {stats.totalOvertimeHours > 0 && (
                          <Badge variant="outline" className="text-orange-600">
                            {stats.totalOvertimeHours.toFixed(1)}h OT
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {employee.records
                      .sort((a: Attendance, b: Attendance) => 
                        new Date(b.attendance_date).getTime() - new Date(a.attendance_date).getTime()
                      )
                      .map((record: Attendance) => (
                        <div key={record.attendance_id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                          <div className="flex items-center gap-3">
                            <div>
                              <div className="font-medium">
                                {format(new Date(record.attendance_date), 'EEE, MMM d, yyyy')}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {record.units?.unit_name}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="font-medium">{record.hours_worked}h</div>
                              {record.overtime_hours > 0 && (
                                <div className="text-sm text-orange-600">
                                  +{record.overtime_hours}h OT
                                </div>
                              )}
                            </div>
                            
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm">
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        );
      })}

      {employeesWithAttendance.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <div className="text-muted-foreground">
              No attendance records found for the selected filters
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
