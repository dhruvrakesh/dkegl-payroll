
import React, { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { CalendarDays, Users, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, isSameDay, parseISO } from 'date-fns';

interface LeaveRecord {
  id: string;
  employee_id: string;
  employee_name: string;
  unit_name: string;
  leave_date: string;
  leave_type: string;
  status: string;
}

interface LeaveConflict {
  date: string;
  employees: string[];
  unit: string;
}

export const LeaveCalendar = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [leaveRecords, setLeaveRecords] = useState<LeaveRecord[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<string>('all');
  const [units, setUnits] = useState<Array<{id: string, name: string}>>([]);
  const [conflicts, setConflicts] = useState<LeaveConflict[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadUnits = async () => {
    try {
      const { data, error } = await supabase
        .from('units')
        .select('unit_id, unit_name')
        .order('unit_name');

      if (error) throw error;
      setUnits(data?.map(u => ({ id: u.unit_id, name: u.unit_name })) || []);
    } catch (error) {
      console.error('Error loading units:', error);
    }
  };

  const loadLeaveRecords = async () => {
    try {
      setLoading(true);
      
      // Get date range for current month
      const startOfMonth = new Date(selectedDate?.getFullYear() || new Date().getFullYear(), 
                                   selectedDate?.getMonth() || new Date().getMonth(), 1);
      const endOfMonth = new Date(selectedDate?.getFullYear() || new Date().getFullYear(), 
                                 (selectedDate?.getMonth() || new Date().getMonth()) + 1, 0);

      let query = supabase
        .from('attendance')
        .select(`
          attendance_id,
          employee_id,
          attendance_date,
          status,
          payroll_employees (
            name,
            unit_id
          ),
          units (
            unit_name
          )
        `)
        .gte('attendance_date', format(startOfMonth, 'yyyy-MM-dd'))
        .lte('attendance_date', format(endOfMonth, 'yyyy-MM-dd'))
        .in('status', ['CASUAL_LEAVE', 'EARNED_LEAVE', 'UNPAID_LEAVE']);

      if (selectedUnit !== 'all') {
        query = query.eq('unit_id', selectedUnit);
      }

      const { data, error } = await query;

      if (error) throw error;

      const records: LeaveRecord[] = data?.map(record => ({
        id: record.attendance_id,
        employee_id: record.employee_id,
        employee_name: record.payroll_employees?.name || 'Unknown',
        unit_name: record.units?.unit_name || 'Unknown',
        leave_date: record.attendance_date,
        leave_type: record.status,
        status: 'approved'
      })) || [];

      setLeaveRecords(records);
      detectConflicts(records);

    } catch (error) {
      console.error('Error loading leave records:', error);
      toast({
        title: "Error",
        description: "Failed to load leave records",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const detectConflicts = (records: LeaveRecord[]) => {
    const dateMap = new Map<string, { employees: string[], unit: string }>();
    
    records.forEach(record => {
      const key = `${record.leave_date}-${record.unit_name}`;
      if (!dateMap.has(key)) {
        dateMap.set(key, { employees: [], unit: record.unit_name });
      }
      dateMap.get(key)!.employees.push(record.employee_name);
    });

    const conflicts: LeaveConflict[] = [];
    dateMap.forEach((value, key) => {
      if (value.employees.length > 2) { // More than 2 employees on leave in same department
        const [date] = key.split('-', 3);
        conflicts.push({
          date,
          employees: value.employees,
          unit: value.unit
        });
      }
    });

    setConflicts(conflicts);
  };

  const getLeavesForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return leaveRecords.filter(record => record.leave_date === dateStr);
  };

  const getLeaveTypeColor = (leaveType: string) => {
    switch (leaveType) {
      case 'CASUAL_LEAVE': return 'bg-blue-100 text-blue-800';
      case 'EARNED_LEAVE': return 'bg-green-100 text-green-800';
      case 'UNPAID_LEAVE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLeaveTypeLabel = (leaveType: string) => {
    switch (leaveType) {
      case 'CASUAL_LEAVE': return 'Casual';
      case 'EARNED_LEAVE': return 'Earned';
      case 'UNPAID_LEAVE': return 'Unpaid';
      default: return leaveType;
    }
  };

  useEffect(() => {
    loadUnits();
  }, []);

  useEffect(() => {
    loadLeaveRecords();
  }, [selectedDate, selectedUnit]);

  const selectedDateLeaves = selectedDate ? getLeavesForDate(selectedDate) : [];
  const isConflictDate = selectedDate && conflicts.find(c => 
    isSameDay(parseISO(c.date), selectedDate)
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Leave Calendar
          </CardTitle>
          <div className="flex gap-4">
            <Select value={selectedUnit} onValueChange={setSelectedUnit}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select Unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Units</SelectItem>
                {units.map(unit => (
                  <SelectItem key={unit.id} value={unit.id}>
                    {unit.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={loadLeaveRecords} disabled={loading}>
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
                modifiers={{
                  hasLeave: (date) => getLeavesForDate(date).length > 0,
                  conflict: (date) => conflicts.some(c => isSameDay(parseISO(c.date), date))
                }}
                modifiersStyles={{
                  hasLeave: { backgroundColor: '#e0f2fe' },
                  conflict: { backgroundColor: '#fee2e2', color: '#dc2626' }
                }}
              />
              
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-sky-100 rounded border"></div>
                  <span className="text-sm">Days with leaves</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-100 rounded border"></div>
                  <span className="text-sm">Potential conflicts (3+ employees)</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {selectedDate && (
                <div>
                  <h3 className="font-semibold mb-3">
                    Leaves on {format(selectedDate, 'MMMM d, yyyy')}
                  </h3>
                  
                  {isConflictDate && (
                    <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm text-yellow-800">
                        High leave volume - potential staffing issue
                      </span>
                    </div>
                  )}

                  {selectedDateLeaves.length > 0 ? (
                    <div className="space-y-3">
                      {selectedDateLeaves.map(leave => (
                        <div key={leave.id} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{leave.employee_name}</p>
                              <p className="text-sm text-muted-foreground">{leave.unit_name}</p>
                            </div>
                            <Badge className={getLeaveTypeColor(leave.leave_type)}>
                              {getLeaveTypeLabel(leave.leave_type)}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No leaves scheduled for this date</p>
                  )}
                </div>
              )}

              {conflicts.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    Potential Conflicts This Month
                  </h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {conflicts.map((conflict, index) => (
                      <div key={index} className="border rounded-lg p-3 bg-yellow-50">
                        <p className="font-medium">{format(parseISO(conflict.date), 'MMM d')}</p>
                        <p className="text-sm text-muted-foreground">{conflict.unit}</p>
                        <p className="text-sm">{conflict.employees.length} employees on leave</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
