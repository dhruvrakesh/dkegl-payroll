import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronLeft, ChevronRight, Plus, UserCheck, Coffee, Plane, Heart, XCircle, Clock } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, startOfWeek, endOfWeek } from 'date-fns';
import { Attendance, Employee, AttendanceFilters, AttendanceStatus } from '@/config/types';
import { AttendanceStatusLegend } from './AttendanceStatusLegend';
import { AttendanceDayDetails } from './AttendanceDayDetails';

interface AttendanceCalendarViewProps {
  attendanceRecords: Attendance[];
  employees: Employee[];
  loading: boolean;
  onRefresh: () => void;
  filters: AttendanceFilters;
}

// This object map replaces the old getStatusIcon function for a type-safe implementation.
const STATUS_ICONS: Record<AttendanceStatus, LucideIcon> = {
  'PRESENT': UserCheck,
  'WEEKLY_OFF': Coffee,
  'CASUAL_LEAVE': Plane,
  'EARNED_LEAVE': Heart,
  'UNPAID_LEAVE': XCircle,
};

export const AttendanceCalendarView: React.FC<AttendanceCalendarViewProps> = ({
  attendanceRecords,
  employees,
  loading,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Generate calendar days, including padding for weeks to ensure full rows.
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Group attendance records by date for efficient lookup.
  const attendanceByDate = new Map<string, Attendance[]>();
  attendanceRecords.forEach(record => {
    // Normalize date to YYYY-MM-DD format to prevent timezone issues.
    const dateKey = format(new Date(record.attendance_date), 'yyyy-MM-dd');
    if (!attendanceByDate.has(dateKey)) {
      attendanceByDate.set(dateKey, []);
    }
    attendanceByDate.get(dateKey)?.push(record);
  });

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'prev' ? -1 : 1));
      return newDate;
    });
  };

  const getAttendanceForDate = (date: Date): Attendance[] => {
    const dateString = format(date, 'yyyy-MM-dd');
    return attendanceByDate.get(dateString) || [];
  };

  const getDayStats = (date: Date) => {
    const dayAttendance = getAttendanceForDate(date);
    const statusCounts = dayAttendance.reduce((acc, record) => {
      const status = record.status as AttendanceStatus;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<AttendanceStatus, number>);

    const totalHours = dayAttendance.reduce((sum, record) => sum + (record.hours_worked || 0), 0);
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
    if (Object.keys(statusCounts).length === 0) return 'bg-background';
    const maxStatus = Object.entries(statusCounts).reduce((max, [status, count]) => count > max.count ? { status, count } : max, { status: '', count: 0 });

    switch (maxStatus.status) {
      case 'PRESENT': return 'bg-green-50 border-green-200';
      case 'WEEKLY_OFF': return 'bg-blue-50 border-blue-200';
      case 'CASUAL_LEAVE': return 'bg-purple-50 border-purple-200';
      case 'EARNED_LEAVE': return 'bg-amber-50 border-amber-200';
      case 'UNPAID_LEAVE': return 'bg-red-50 border-red-200';
      default: return 'bg-background';
    }
  };

  const getStatusColor = (status: AttendanceStatus) => {
    switch (status) {
      case 'PRESENT': return 'text-green-600';
      case 'WEEKLY_OFF': return 'text-blue-600';
      case 'CASUAL_LEAVE': return 'text-purple-600';
      case 'EARNED_LEAVE': return 'text-amber-600';
      case 'UNPAID_LEAVE': return 'text-red-600';
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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {format(currentDate, 'MMMM yyyy')}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}><ChevronLeft className="w-4 h-4" /></Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>Today</Button>
              <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}><ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1"><AttendanceStatusLegend /></div>
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-7 gap-2 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-2 text-center font-medium text-sm text-muted-foreground">{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map(day => {
                  const stats = getDayStats(day);
                  const isToday = isSameDay(day, new Date());
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const cellBackground = getDayCellBackground(stats.statusCounts);
                  
                  return (
                    <div
                      key={day.toISOString()}
                      className={`min-h-[120px] p-2 border rounded-lg cursor-pointer transition-all duration-200 ${!isCurrentMonth ? 'bg-muted/30 text-muted-foreground' : cellBackground} ${isToday ? 'ring-2 ring-primary' : ''} hover:shadow-md hover:scale-[1.02]`}
                      onClick={() => isCurrentMonth && handleDayClick(day, stats.records)}
                    >
                      <div className="flex flex-col h-full">
                        <div className="text-sm font-medium mb-2">{format(day, 'd')}</div>
                        {isCurrentMonth && stats.employeeCount > 0 && (
                          <div className="space-y-1 flex-1">
                            <div className="space-y-1">
                              {Object.entries(stats.statusCounts).map(([status, count]) => {
                                // This is the corrected, type-safe implementation
                                const IconComponent = STATUS_ICONS[status as AttendanceStatus] || Clock;
                                const colorClass = getStatusColor(status as AttendanceStatus);
                                return (
                                  <div key={status} className={`flex items-center gap-1 text-xs font-medium ${colorClass}`}>
                                    <IconComponent className="w-3 h-3" />
                                    <span>{count}</span>
                                  </div>
                                );
                              })}
                            </div>
                            {stats.totalHours > 0 && (
                              <div className="text-xs text-muted-foreground mt-2 pt-1 border-t">
                                {stats.totalHours}h
                                {stats.totalOvertime > 0 && <span className="text-orange-600"> +{stats.totalOvertime}h OT</span>}
                              </div>
                            )}
                          </div>
                        )}
                        {isCurrentMonth && stats.employeeCount === 0 && (
                          <div className="flex-1 flex items-center justify-center"><Plus className="w-4 h-4 text-muted-foreground/50" /></div>
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
