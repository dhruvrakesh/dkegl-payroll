
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { UserCheck, Coffee, Plane, Heart, XCircle, Clock } from 'lucide-react';
import { Attendance, Employee } from '@/config/types';
import { format } from 'date-fns';

interface AttendanceDayDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | null;
  dayAttendance: Attendance[];
  employees: Employee[];
}

export const AttendanceDayDetails: React.FC<AttendanceDayDetailsProps> = ({
  open,
  onOpenChange,
  selectedDate,
  dayAttendance,
  employees
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PRESENT': return UserCheck;
      case 'WEEKLY_OFF': return Coffee;
      case 'CASUAL_LEAVE': return Plane;
      case 'EARNED_LEAVE': return Heart;
      case 'UNPAID_LEAVE': return XCircle;
      default: return Clock;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PRESENT': return 'bg-green-100 border-green-300 text-green-800';
      case 'WEEKLY_OFF': return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'CASUAL_LEAVE': return 'bg-purple-100 border-purple-300 text-purple-800';
      case 'EARNED_LEAVE': return 'bg-amber-100 border-amber-300 text-amber-800';
      case 'UNPAID_LEAVE': return 'bg-red-100 border-red-300 text-red-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PRESENT': return 'Present';
      case 'WEEKLY_OFF': return 'Weekly Off';
      case 'CASUAL_LEAVE': return 'Casual Leave';
      case 'EARNED_LEAVE': return 'Earned Leave';
      case 'UNPAID_LEAVE': return 'Unpaid Leave';
      default: return status;
    }
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee?.name || 'Unknown Employee';
  };

  if (!selectedDate) return null;

  const statusCounts = dayAttendance.reduce((acc, record) => {
    acc[record.status] = (acc[record.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Attendance Details - {format(selectedDate, 'PPP')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status Summary */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-3">Status Summary</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(statusCounts).map(([status, count]) => {
                  const Icon = getStatusIcon(status);
                  return (
                    <Badge 
                      key={status} 
                      className={`${getStatusColor(status)} border flex items-center gap-1`}
                    >
                      <Icon className="w-3 h-3" />
                      {getStatusLabel(status)}: {count}
                    </Badge>
                  );
                })}
              </div>
              <div className="mt-3 text-sm text-muted-foreground">
                Total Records: {dayAttendance.length}
              </div>
            </CardContent>
          </Card>

          {/* Detailed Records */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-3">Individual Records</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {dayAttendance.map((record) => {
                  const Icon = getStatusIcon(record.status);
                  return (
                    <div 
                      key={record.attendance_id} 
                      className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Badge className={`${getStatusColor(record.status)} border flex items-center gap-1`}>
                          <Icon className="w-3 h-3" />
                          {getStatusLabel(record.status)}
                        </Badge>
                        <span className="font-medium">
                          {getEmployeeName(record.employee_id)}
                        </span>
                      </div>
                      
                      <div className="text-right text-sm text-muted-foreground">
                        {record.status === 'PRESENT' && (
                          <>
                            <div>Hours: {record.hours_worked}</div>
                            {record.overtime_hours && record.overtime_hours > 0 && (
                              <div>OT: {record.overtime_hours}h</div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
