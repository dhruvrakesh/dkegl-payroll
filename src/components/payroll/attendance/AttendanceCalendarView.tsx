
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, isSameMonth, getDay } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

interface AttendanceCalendarViewProps {
  attendanceRecords: Attendance[];
  employees: Employee[];
  loading: boolean;
  onRefresh: () => void;
}

export const AttendanceCalendarView: React.FC<AttendanceCalendarViewProps> = ({
  employees,
  loading: parentLoading,
  onRefresh
}) => {
  // Initialize to current month instead of hardcoded June 2025
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [calendarData, setCalendarData] = useState<Attendance[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const { toast } = useToast();

  // Fetch calendar-specific data for the current month - DYNAMICALLY BASED ON currentMonth
  const fetchCalendarData = async () => {
    try {
      setCalendarLoading(true);
      
      // DYNAMIC FIX: Calculate start and end dates based on currentMonth state
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);
      const startDate = format(monthStart, 'yyyy-MM-dd');
      const endDate = format(monthEnd, 'yyyy-MM-dd');
      
      console.log('🔍 DYNAMIC CALENDAR FETCH:', {
        currentMonth: currentMonth.toISOString(),
        monthStart: monthStart.toISOString(),
        monthEnd: monthEnd.toISOString(),
        startDate,
        endDate,
        monthName: format(currentMonth, 'MMMM yyyy')
      });
      
      // CONFIRMED: No limit applied - fetch ALL records for the month
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          attendance_id,
          employee_id,
          attendance_date,
          hours_worked,
          overtime_hours,
          payroll_employees (
            name,
            unit_id
          ),
          units (
            unit_name
          )
        `)
        .gte('attendance_date', startDate)
        .lte('attendance_date', endDate)
        .order('attendance_date', { ascending: true });

      if (error) {
        console.error('🚨 Supabase query error:', error);
        throw error;
      }
      
      console.log('📊 DYNAMIC CALENDAR DATA RESULT:', {
        monthName: format(currentMonth, 'MMMM yyyy'),
        totalRecords: data?.length || 0,
        dateRange: { start: startDate, end: endDate },
        uniqueDates: [...new Set(data?.map(r => r.attendance_date) || [])].sort(),
        firstRecord: data?.[0] ? { 
          date: data[0].attendance_date, 
          emp: data[0].employee_id?.slice(0, 8), 
          hours: data[0].hours_worked 
        } : null,
        lastRecord: data?.[data.length - 1] ? { 
          date: data[data.length - 1].attendance_date, 
          emp: data[data.length - 1].employee_id?.slice(0, 8), 
          hours: data[data.length - 1].hours_worked 
        } : null
      });
      
      setCalendarData(data || []);
      
    } catch (error) {
      console.error('❌ Error fetching calendar data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch calendar data",
        variant: "destructive",
      });
    } finally {
      setCalendarLoading(false);
    }
  };

  // Re-fetch data whenever currentMonth changes
  useEffect(() => {
    fetchCalendarData();
  }, [currentMonth]);

  // Generate proper calendar grid with correct day alignment
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday = 0
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Group attendance records by date using ONLY calendar data (not filtered attendanceRecords)
  const attendanceByDate = new Map<string, Attendance[]>();
  calendarData.forEach(record => {
    const dateKey = record.attendance_date; // This is already in YYYY-MM-DD format
    if (!attendanceByDate.has(dateKey)) {
      attendanceByDate.set(dateKey, []);
    }
    attendanceByDate.get(dateKey)!.push(record);
  });

  // Clean debug logging - now generic for any month
  console.log('📋 AttendanceByDate Map contents:', {
    currentMonth: format(currentMonth, 'MMMM yyyy'),
    totalKeys: attendanceByDate.size,
    mapKeys: Array.from(attendanceByDate.keys()).sort(),
    sampleDateCounts: Object.fromEntries(
      Array.from(attendanceByDate.keys()).slice(0, 10).map(k => [k, attendanceByDate.get(k)?.length || 0])
    )
  });

  const getDayAttendance = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayRecords = attendanceByDate.get(dateStr) || [];
    
    // Generic logging for troubleshooting any month
    if (dayRecords.length > 0) {
      console.log(`📅 getDayAttendance for ${dateStr}:`, {
        dateStr,
        recordsFound: dayRecords.length,
        firstRecord: dayRecords[0] ? { 
          id: dayRecords[0].employee_id?.slice(0, 8), 
          hours: dayRecords[0].hours_worked,
          date: dayRecords[0].attendance_date
        } : null,
        mapHasKey: attendanceByDate.has(dateStr),
        totalMapSize: attendanceByDate.size
      });
    }
    
    // Enrich records with employee names if missing
    return dayRecords.map((record: Attendance) => ({
      ...record,
      payroll_employees: record.payroll_employees || {
        name: employees.find(emp => emp.id === record.employee_id)?.name || 'Unknown Employee'
      }
    }));
  };

  const getTotalHoursForDay = (date: Date) => {
    const dayAttendance = getDayAttendance(date);
    return dayAttendance.reduce((sum: number, record: Attendance) => sum + record.hours_worked, 0);
  };

  const getEmployeeCountForDay = (date: Date) => {
    const dayAttendance = getDayAttendance(date);
    return new Set(dayAttendance.map((record: Attendance) => record.employee_id)).size;
  };

  const getWorkingEmployeeCountForDay = (date: Date) => {
    const dayAttendance = getDayAttendance(date);
    return dayAttendance.filter((record: Attendance) => record.hours_worked > 0).length;
  };

  const isWeeklyOff = (date: Date) => {
    const dayAttendance = getDayAttendance(date);
    return dayAttendance.length > 0 && dayAttendance.every((record: Attendance) => record.hours_worked === 0);
  };

  // DYNAMIC NAVIGATION: These functions will now properly trigger re-fetch
  const previousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  if (calendarLoading || parentLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-muted-foreground">Loading attendance data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">
              {format(currentMonth, 'MMMM yyyy')}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={previousMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentMonth(new Date())}
              >
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={nextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 text-center font-medium text-sm text-muted-foreground">
                {day}
              </div>
            ))}
            
            {/* Calendar days */}
            {calendarDays.map(date => {
              const isCurrentMonth = isSameMonth(date, currentMonth);
              const dayAttendance = getDayAttendance(date);
              const totalHours = getTotalHoursForDay(date);
              const employeeCount = getEmployeeCountForDay(date);
              const workingCount = getWorkingEmployeeCountForDay(date);
              const weeklyOff = isWeeklyOff(date);
              const isSelected = selectedDate && isSameDay(date, selectedDate);
              
              // Determine visual styling based on day type
              let dayStyle = '';
              if (isCurrentMonth && dayAttendance.length > 0) {
                if (weeklyOff) {
                  dayStyle = 'bg-blue-50 border-blue-200'; // Weekly off (all zero hours)
                } else if (workingCount > 0) {
                  dayStyle = 'bg-green-50 border-green-200'; // Regular work day
                } else {
                  dayStyle = 'bg-gray-50 border-gray-200'; // All employees on leave
                }
              }
              
              return (
                <div
                  key={date.toISOString()}
                  className={`
                    p-2 min-h-[80px] border rounded-lg cursor-pointer transition-colors
                    ${!isCurrentMonth ? 'opacity-30 text-muted-foreground' : ''}
                    ${isSelected ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'}
                    ${dayStyle}
                  `}
                  onClick={() => setSelectedDate(isSelected ? null : date)}
                >
                  <div className="text-sm font-medium mb-1">
                    {format(date, 'd')}
                  </div>
                  {isCurrentMonth && dayAttendance.length > 0 && (
                    <div className="space-y-1">
                      <Badge 
                        variant={weeklyOff ? "default" : workingCount > 0 ? "secondary" : "outline"} 
                        className="text-xs"
                      >
                        {employeeCount} emp
                      </Badge>
                      <div className="text-xs text-muted-foreground">
                        {weeklyOff ? 'Weekly Off' : `${totalHours.toFixed(1)}h`}
                      </div>
                      {!weeklyOff && workingCount !== employeeCount && (
                        <div className="text-xs text-orange-600">
                          {employeeCount - workingCount} leave
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected Date Details */}
      {selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle>
              Attendance for {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {getDayAttendance(selectedDate).length > 0 ? (
              (() => {
                const dayRecords = getDayAttendance(selectedDate);
                const workingRecords = dayRecords.filter(record => record.hours_worked > 0);
                const leaveRecords = dayRecords.filter(record => record.hours_worked === 0);
                const weeklyOff = isWeeklyOff(selectedDate);
                
                return (
                  <div className="space-y-4">
                    {/* Summary */}
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <div className="text-sm font-medium">
                        {weeklyOff ? 'Weekly Off' : `${workingRecords.length} working, ${leaveRecords.length} on leave`}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Total: {dayRecords.length} employees • {getTotalHoursForDay(selectedDate).toFixed(1)} hours worked
                      </div>
                    </div>

                    {/* Working employees */}
                    {workingRecords.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm text-green-700 mb-2">Working ({workingRecords.length})</h4>
                        <div className="space-y-2">
                          {workingRecords.map((record: Attendance) => (
                            <div key={record.attendance_id} className="flex items-center justify-between p-3 border border-green-200 bg-green-50 rounded-lg">
                              <div>
                                <div className="font-medium">{record.payroll_employees?.name || 'Unknown Employee'}</div>
                                <div className="text-sm text-muted-foreground">
                                  {record.units?.unit_name || 'No Unit'}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium text-green-700">{record.hours_worked}h</div>
                                {record.overtime_hours > 0 && (
                                  <div className="text-sm text-orange-600">
                                    +{record.overtime_hours}h OT
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Leave/Weekly off employees */}
                    {leaveRecords.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm text-gray-600 mb-2">
                          {weeklyOff ? 'Weekly Off' : 'On Leave'} ({leaveRecords.length})
                        </h4>
                        <div className="space-y-2">
                          {leaveRecords.map((record: Attendance) => (
                            <div key={record.attendance_id} className="flex items-center justify-between p-3 border border-gray-200 bg-gray-50 rounded-lg">
                              <div>
                                <div className="font-medium text-gray-700">{record.payroll_employees?.name || 'Unknown Employee'}</div>
                                <div className="text-sm text-muted-foreground">
                                  {record.units?.unit_name || 'No Unit'}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium text-gray-500">
                                  {weeklyOff ? 'Weekly Off' : 'Leave'}
                                </div>
                                {record.overtime_hours > 0 && (
                                  <div className="text-sm text-orange-600">
                                    +{record.overtime_hours}h OT
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No attendance records for this date
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
