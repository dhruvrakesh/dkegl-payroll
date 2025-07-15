
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth } from 'date-fns';
import { Attendance, Employee, AttendanceFilters } from '@/config/types';

interface AttendanceCalendarViewProps {
  attendanceRecords: Attendance[];
  employees: Employee[];
  loading: boolean;
  onRefresh: () => void;
  filters: AttendanceFilters;
}

export const AttendanceCalendarView: React.FC<AttendanceCalendarViewProps> = ({
  attendanceRecords,
  employees,
  loading,
  onRefresh,
  filters
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Generate calendar days for the current month
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Group attendance records by date
  const attendanceByDate = new Map();
  attendanceRecords.forEach(record => {
    const date = record.attendance_date;
    if (!attendanceByDate.has(date)) {
      attendanceByDate.set(date, []);
    }
    attendanceByDate.get(date).push(record);
  });

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getAttendanceForDate = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return attendanceByDate.get(dateString) || [];
  };

  const getDayStats = (date: Date) => {
    const dayAttendance = getAttendanceForDate(date);
    const totalHours = dayAttendance.reduce((sum, record) => sum + record.hours_worked, 0);
    const totalOvertime = dayAttendance.reduce((sum, record) => sum + (record.overtime_hours || 0), 0);
    return {
      employeeCount: dayAttendance.length,
      totalHours,
      totalOvertime
    };
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading calendar...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {format(currentDate, 'MMMM yyyy')}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                Today
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-4">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 text-center font-medium text-muted-foreground">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map(day => {
              const stats = getDayStats(day);
              const isToday = isSameDay(day, new Date());
              const isCurrentMonth = isSameMonth(day, currentDate);
              
              return (
                <div
                  key={day.toISOString()}
                  className={`
                    min-h-[100px] p-2 border rounded-lg cursor-pointer transition-colors
                    ${isCurrentMonth ? 'bg-background' : 'bg-muted/50'}
                    ${isToday ? 'ring-2 ring-primary' : ''}
                    hover:bg-muted/70
                  `}
                >
                  <div className="flex flex-col h-full">
                    <div className={`text-sm font-medium mb-2 ${!isCurrentMonth ? 'text-muted-foreground' : ''}`}>
                      {format(day, 'd')}
                    </div>
                    
                    {stats.employeeCount > 0 && (
                      <div className="space-y-1 flex-1">
                        <Badge variant="secondary" className="text-xs">
                          {stats.employeeCount} emp
                        </Badge>
                        
                        <div className="text-xs text-muted-foreground">
                          {stats.totalHours}h
                        </div>
                        
                        {stats.totalOvertime > 0 && (
                          <div className="text-xs text-orange-600">
                            +{stats.totalOvertime}h OT
                          </div>
                        )}
                      </div>
                    )}
                    
                    {stats.employeeCount === 0 && isCurrentMonth && (
                      <div className="flex-1 flex items-center justify-center">
                        <Plus className="w-4 h-4 text-muted-foreground/50" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {attendanceRecords.length}
            </div>
            <div className="text-sm text-muted-foreground">
              Total Records This Month
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {attendanceRecords.reduce((sum, record) => sum + record.hours_worked, 0).toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">
              Total Hours Worked
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {attendanceRecords.reduce((sum, record) => sum + (record.overtime_hours || 0), 0).toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">
              Total Overtime Hours
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
