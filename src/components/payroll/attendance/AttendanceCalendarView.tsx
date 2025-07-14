
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
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
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [calendarData, setCalendarData] = useState<Attendance[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const { toast } = useToast();

  // Enhanced database investigation function
  const investigateDatabase = async () => {
    try {
      console.log('🔍 INVESTIGATING DATABASE FOR ATTENDANCE DATA');
      
      // Check total records in attendance table
      const { count: totalRecords, error: countError } = await supabase
        .from('attendance')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.error('Error counting total records:', countError);
        return;
      }
      
      // Check June 2024 data specifically
      const { data: juneData, error: juneError } = await supabase
        .from('attendance')
        .select('attendance_date, employee_id, hours_worked')
        .gte('attendance_date', '2024-06-01')
        .lte('attendance_date', '2024-06-30')
        .order('attendance_date');
      
      if (juneError) {
        console.error('Error fetching June data:', juneError);
        return;
      }
      
      // Check for June 24-30 specifically
      const june24to30 = juneData?.filter(record => {
        const date = new Date(record.attendance_date);
        return date.getDate() >= 24 && date.getDate() <= 30;
      }) || [];
      
      const debugData = {
        totalRecords,
        juneRecordsTotal: juneData?.length || 0,
        june24to30Count: june24to30.length,
        june24to30Records: june24to30,
        uniqueJuneDates: [...new Set(juneData?.map(r => r.attendance_date) || [])].sort(),
        missingDates: []
      };
      
      // Check for missing dates in June 24-30
      for (let day = 24; day <= 30; day++) {
        const dateStr = `2024-06-${day.toString().padStart(2, '0')}`;
        const hasData = juneData?.some(r => r.attendance_date === dateStr);
        if (!hasData) {
          debugData.missingDates.push(dateStr);
        }
      }
      
      console.log('📊 DATABASE INVESTIGATION RESULTS:', debugData);
      setDebugInfo(debugData);
      
      if (debugData.missingDates.length > 0) {
        toast({
          title: "Missing Attendance Data",
          description: `No attendance records found for: ${debugData.missingDates.join(', ')}`,
          variant: "destructive",
        });
      }
      
    } catch (error) {
      console.error('❌ Database investigation failed:', error);
    }
  };

  // Fetch calendar-specific data for the current month - FULLY DYNAMIC
  const fetchCalendarData = async () => {
    try {
      setCalendarLoading(true);
      
      // DYNAMIC MONTH CALCULATION - No hardcoded dates
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);
      const startDate = format(monthStart, 'yyyy-MM-dd');
      const endDate = format(monthEnd, 'yyyy-MM-dd');
      
      console.log('🔍 FETCHING CALENDAR DATA:', {
        currentMonth: format(currentMonth, 'MMMM yyyy'),
        monthStart: format(monthStart, 'yyyy-MM-dd'),
        monthEnd: format(monthEnd, 'yyyy-MM-dd'),
        startDate,
        endDate
      });
      
      // Fetch ALL records for the month (no limit)
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
      
      console.log('📊 CALENDAR DATA RESULT:', {
        monthName: format(currentMonth, 'MMMM yyyy'),
        totalRecords: data?.length || 0,
        dateRange: { start: startDate, end: endDate },
        uniqueDates: [...new Set(data?.map(r => r.attendance_date) || [])].sort(),
        sampleRecords: data?.slice(0, 3).map(r => ({
          date: r.attendance_date,
          employee: r.employee_id?.slice(0, 8),
          hours: r.hours_worked
        })) || []
      });
      
      setCalendarData(data || []);
      
      // Auto-investigate if current month is June 2024
      if (format(currentMonth, 'yyyy-MM') === '2024-06') {
        await investigateDatabase();
      }
      
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

  // Group attendance records by date using ONLY calendar data
  const attendanceByDate = new Map<string, Attendance[]>();
  calendarData.forEach(record => {
    const dateKey = record.attendance_date; // This is already in YYYY-MM-DD format
    if (!attendanceByDate.has(dateKey)) {
      attendanceByDate.set(dateKey, []);
    }
    attendanceByDate.get(dateKey)!.push(record);
  });

  const getDayAttendance = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayRecords = attendanceByDate.get(dateStr) || [];
    
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
      {/* Debug Info Panel - Show when investigating */}
      {debugInfo && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertCircle className="w-5 h-5" />
              Database Investigation Results
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-orange-700">
            <div className="space-y-2">
              <p><strong>Total Attendance Records:</strong> {debugInfo.totalRecords}</p>
              <p><strong>June 2024 Records:</strong> {debugInfo.juneRecordsTotal}</p>
              <p><strong>June 24-30 Records:</strong> {debugInfo.june24to30Count}</p>
              {debugInfo.missingDates.length > 0 && (
                <p><strong>Missing Dates:</strong> {debugInfo.missingDates.join(', ')}</p>
              )}
              <details className="mt-2">
                <summary className="cursor-pointer font-medium">View Unique June Dates</summary>
                <div className="mt-2 text-xs bg-white p-2 rounded border">
                  {debugInfo.uniqueJuneDates.join(', ')}
                </div>
              </details>
            </div>
          </CardContent>
        </Card>
      )}

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
              {format(currentMonth, 'yyyy-MM') === '2024-06' && (
                <Button variant="outline" size="sm" onClick={investigateDatabase}>
                  Investigate DB
                </Button>
              )}
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
