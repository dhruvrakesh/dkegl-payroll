
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, ChevronLeft, ChevronRight, Plus, UserCheck, Coffee, Plane, Heart, XCircle, Clock } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth } from 'date-fns';
import { Attendance, Employee, AttendanceFilters } from '@/config/types';
import { AttendanceStatusLegend } from './AttendanceStatusLegend';
import { AttendanceDayDetails } from './AttendanceDayDetails';

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
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

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
    
    // Group by status
    const statusCounts = dayAttendance.reduce((acc, record) => {
      acc[record.status] = (acc[record.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalHours = dayAttendance.reduce((sum, record) => sum + record.hours_worked, 0);
    const totalOvertime = dayAttendance.reduce((sum, record) => sum + (record.overtime_hours || 0), 0);
    
    return {
      employeeCount: dayAttendance.length,
      totalHours,
      totalOvertime,
      statusCounts,
      records: dayAttendance
    };
  };

  const getDayCellBackground = (statusCounts: Record<string, number>) => {
    // Determine primary status for background color
    const maxStatus = Object.entries(statusCounts).reduce((max, [status, count]) => 
      count > max.count ? { status, count } : max
    , { status: '', count: 0 });

    switch (maxStatus.status) {
      case 'PRESENT': return 'bg-green-50 border-green-200';
      case 'WEEKLY_OFF': return 'bg-blue-50 border-blue-200';
      case 'CASUAL_LEAVE': return 'bg-purple-50 border-purple-200';
      case 'EARNED_LEAVE': return 'bg-amber-50 border-amber-200';
      case 'UNPAID_LEAVE': return 'bg-red-50 border-red-200';
      default: return 'bg-background';
    }
  };

  const getStatusIcon = (status: string): LucideIcon => {
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
      case 'PRESENT': return 'text-green-600';
      case 'WEEKLY_OFF': return 'text-blue-600';
      case 'CASUAL_LEAVE': return 'text-purple-600';
      case 'EARNED_LEAVE': return 'text-amber-600';
      case 'UNPAID_LEAVE': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const handleDayClick = (date: Date, dayAttendance: Attendance[]) => {
    if (dayAttendance.length > 0) {
      setSelectedDate(date);
      setDetailsOpen(true);
    }
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Status Legend */}
        <div className="lg:col-span-1">
          <AttendanceStatusLegend />
        </div>

        {/* Calendar Grid */}
        <div className="lg:col-span-3">
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
                  const cellBackground = getDayCellBackground(stats.statusCounts);
                  
                  return (
                    <div
                      key={day.toISOString()}
                      className={`
                        min-h-[120px] p-2 border rounded-lg cursor-pointer transition-all duration-200
                        ${isCurrentMonth ? cellBackground : 'bg-muted/50'}
                        ${isToday ? 'ring-2 ring-primary' : ''}
                        hover:shadow-md hover:scale-[1.02]
                      `}
                      onClick={() => handleDayClick(day, stats.records)}
                    >
                      <div className="flex flex-col h-full">
                        <div className={`text-sm font-medium mb-2 ${!isCurrentMonth ? 'text-muted-foreground' : ''}`}>
                          {format(day, 'd')}
                        </div>
                        
                        {stats.employeeCount > 0 && (
                          <div className="space-y-1 flex-1">
                            {/* Status breakdown */}
                            <div className="space-y-1">
                              {Object.entries(stats.statusCounts).map(([status, count]) => {
                                const StatusIcon = getStatusIcon(status);
                                const colorClass = getStatusColor(status);
                                return (
                                  <div key={status} className={`flex items-center gap-1 text-xs ${colorClass}`}>
                                    <StatusIcon className="w-3 h-3" />
                                    <span>{count}</span>
                                  </div>
                                );
                              })}
                            </div>
                            
                            {/* Hours summary for present days */}
                            {stats.totalHours > 0 && (
                              <div className="text-xs text-muted-foreground mt-2">
                                {stats.totalHours}h
                                {stats.totalOvertime > 0 && (
                                  <span className="text-orange-600"> +{stats.totalOvertime}h OT</span>
                                )}
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
        </div>
      </div>

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

      {/* Day Details Dialog */}
      <AttendanceDayDetails
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        selectedDate={selectedDate}
        dayAttendance={selectedDate ? getAttendanceForDate(selectedDate) : []}
        employees={employees}
      />
    </div>
  );
};
