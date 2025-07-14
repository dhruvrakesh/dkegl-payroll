
import { useState, useEffect } from 'react';
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
  unit_id?: string;
  active: boolean;
}

interface AttendanceFilters {
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  employeeIds: string[];
  unitIds: string[];
}

interface UnitWiseData {
  unitId: string;
  unitName: string;
  totalEmployees: number;
  employeesWithAttendance: number;
  totalHours: number;
  totalOvertimeHours: number;
  averageHours: number;
  utilizationRate: number;
}

interface AggregatedData {
  totalEmployees: number;
  totalActiveEmployees: number;
  employeesWithAttendance: number;
  totalHours: number;
  totalOvertimeHours: number;
  averageHoursPerDay: number;
  attendanceRate: number;
  dailyStats: Array<{
    date: string;
    totalHours: number;
    employeeCount: number;
  }>;
  employeeStats: Array<{
    employeeId: string;
    employeeName: string;
    totalHours: number;
    totalDays: number;
    averageHours: number;
  }>;
  unitWiseStats: UnitWiseData[];
}

export const useAttendanceData = (filters: AttendanceFilters) => {
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [aggregatedData, setAggregatedData] = useState<AggregatedData>({
    totalEmployees: 0,
    totalActiveEmployees: 0,
    employeesWithAttendance: 0,
    totalHours: 0,
    totalOvertimeHours: 0,
    averageHoursPerDay: 0,
    attendanceRate: 0,
    dailyStats: [],
    employeeStats: [],
    unitWiseStats: []
  });
  const { toast } = useToast();

  const fetchAttendanceRecords = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('attendance')
        .select(`
          *,
          payroll_employees (
            name,
            unit_id
          ),
          units (
            unit_name
          )
        `);

      // Apply date filters
      if (filters.dateRange.from) {
        query = query.gte('attendance_date', filters.dateRange.from.toISOString().split('T')[0]);
      }
      if (filters.dateRange.to) {
        query = query.lte('attendance_date', filters.dateRange.to.toISOString().split('T')[0]);
      }

      // Apply employee filters
      if (filters.employeeIds.length > 0) {
        query = query.in('employee_id', filters.employeeIds);
      }

      // Apply unit filters by first getting employees from selected units
      if (filters.unitIds.length > 0) {
        const { data: unitEmployees, error: unitEmpError } = await supabase
          .from('payroll_employees')
          .select('id')
          .in('unit_id', filters.unitIds);

        if (unitEmpError) throw unitEmpError;

        const employeeIds = unitEmployees?.map(emp => emp.id) || [];
        if (employeeIds.length > 0) {
          query = query.in('employee_id', employeeIds);
        } else {
          // No employees in selected units, return empty result
          setAttendanceRecords([]);
          await calculateAggregatedData([]);
          return;
        }
      }

      const { data, error } = await query.order('attendance_date', { ascending: false });

      if (error) throw error;
      
      const records = data || [];
      setAttendanceRecords(records);
      
      // Calculate aggregated data
      await calculateAggregatedData(records);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast({
        title: "Error",
        description: "Failed to fetch attendance records",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('payroll_employees')
        .select('id, name, unit_id, active')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const calculateAggregatedData = async (records: Attendance[]) => {
    try {
      // Get total employee counts
      const { data: allEmployees, error: empError } = await supabase
        .from('payroll_employees')
        .select('id, name, unit_id, active');

      if (empError) throw empError;

      // Get unit information - using the correct column names
      const { data: units, error: unitError } = await supabase
        .from('units')
        .select('unit_id, unit_name, unit_code, location');

      if (unitError) throw unitError;

      const totalEmployees = allEmployees?.length || 0;
      const totalActiveEmployees = allEmployees?.filter(emp => emp.active)?.length || 0;
      
      if (records.length === 0) {
        setAggregatedData({
          totalEmployees,
          totalActiveEmployees,
          employeesWithAttendance: 0,
          totalHours: 0,
          totalOvertimeHours: 0,
          averageHoursPerDay: 0,
          attendanceRate: 0,
          dailyStats: [],
          employeeStats: [],
          unitWiseStats: []
        });
        return;
      }

      const uniqueEmployees = new Set(records.map(r => r.employee_id));
      const employeesWithAttendance = uniqueEmployees.size;
      const totalHours = records.reduce((sum, r) => sum + r.hours_worked, 0);
      const totalOvertimeHours = records.reduce((sum, r) => sum + (r.overtime_hours || 0), 0);
      
      // Calculate daily stats
      const dailyMap = new Map();
      records.forEach(record => {
        const date = record.attendance_date;
        if (!dailyMap.has(date)) {
          dailyMap.set(date, { totalHours: 0, employeeCount: 0, employees: new Set() });
        }
        const dayData = dailyMap.get(date);
        dayData.totalHours += record.hours_worked;
        dayData.employees.add(record.employee_id);
        dayData.employeeCount = dayData.employees.size;
      });

      const dailyStats = Array.from(dailyMap.entries()).map(([date, data]) => ({
        date,
        totalHours: data.totalHours,
        employeeCount: data.employeeCount
      })).sort((a, b) => a.date.localeCompare(b.date));

      // Calculate employee stats
      const employeeMap = new Map();
      records.forEach(record => {
        const empId = record.employee_id;
        const empName = record.payroll_employees?.name || 'Unknown';
        if (!employeeMap.has(empId)) {
          employeeMap.set(empId, { 
            employeeId: empId, 
            employeeName: empName, 
            totalHours: 0, 
            totalDays: 0 
          });
        }
        const empData = employeeMap.get(empId);
        empData.totalHours += record.hours_worked;
        empData.totalDays += 1;
      });

      const employeeStats = Array.from(employeeMap.values()).map(emp => ({
        ...emp,
        averageHours: emp.totalDays > 0 ? emp.totalHours / emp.totalDays : 0
      }));

      // Calculate unit-wise stats
      const unitWiseStats: UnitWiseData[] = [];
      const unitMap = new Map(units?.map(u => [u.unit_id, u.unit_name]) || []);

      for (const unit of units || []) {
        const unitEmployees = allEmployees?.filter(emp => emp.unit_id === unit.unit_id) || [];
        const unitAttendanceRecords = records.filter(record => {
          const employee = allEmployees?.find(emp => emp.id === record.employee_id);
          return employee?.unit_id === unit.unit_id;
        });

        const unitEmployeesWithAttendance = new Set(unitAttendanceRecords.map(r => r.employee_id)).size;
        const unitTotalHours = unitAttendanceRecords.reduce((sum, r) => sum + r.hours_worked, 0);
        const unitTotalOvertimeHours = unitAttendanceRecords.reduce((sum, r) => sum + (r.overtime_hours || 0), 0);
        const unitAverageHours = unitAttendanceRecords.length > 0 ? unitTotalHours / unitAttendanceRecords.length : 0;
        const utilizationRate = unitEmployees.length > 0 ? (unitEmployeesWithAttendance / unitEmployees.length) * 100 : 0;

        unitWiseStats.push({
          unitId: unit.unit_id,
          unitName: unit.unit_name,
          totalEmployees: unitEmployees.length,
          employeesWithAttendance: unitEmployeesWithAttendance,
          totalHours: unitTotalHours,
          totalOvertimeHours: unitTotalOvertimeHours,
          averageHours: unitAverageHours,
          utilizationRate
        });
      }

      const averageHoursPerDay = dailyStats.length > 0 
        ? dailyStats.reduce((sum, day) => sum + day.totalHours, 0) / dailyStats.length 
        : 0;

      const attendanceRate = totalActiveEmployees > 0 ? (employeesWithAttendance / totalActiveEmployees) * 100 : 0;

      setAggregatedData({
        totalEmployees,
        totalActiveEmployees,
        employeesWithAttendance,
        totalHours,
        totalOvertimeHours,
        averageHoursPerDay,
        attendanceRate,
        dailyStats,
        employeeStats,
        unitWiseStats
      });
    } catch (error) {
      console.error('Error calculating aggregated data:', error);
    }
  };

  const refreshAttendance = () => {
    fetchAttendanceRecords();
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchAttendanceRecords();
  }, [filters]);

  return {
    attendanceRecords,
    employees,
    loading,
    refreshAttendance,
    aggregatedData
  };
};
