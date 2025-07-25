
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Filter, X, Building2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useUnitsData } from '@/hooks/useUnitsData';
import { FILTER_VALUES, QUICK_DATE_RANGES } from '@/config/constants';
import { getDefaultAttendanceFilters } from '@/config/utils';
import { AttendanceFilters as AttendanceFiltersType, Employee } from '@/config/types';

interface AttendanceFiltersProps {
  filters: AttendanceFiltersType;
  onFiltersChange: (filters: AttendanceFiltersType) => void;
  employees: Employee[];
}

export const AttendanceFilters: React.FC<AttendanceFiltersProps> = ({
  filters,
  onFiltersChange,
  employees
}) => {
  const { units, loading: unitsLoading } = useUnitsData();

  const updateFilters = (updates: Partial<AttendanceFiltersType>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const clearFilters = () => {
    // Reset to intelligent defaults instead of null values
    onFiltersChange(getDefaultAttendanceFilters());
  };

  const hasActiveFilters = 
    filters.dateRange.from || 
    filters.dateRange.to || 
    filters.employeeIds.length > 0 || 
    filters.unitIds.length > 0;

  // Filter employees by selected units if any units are selected
  const filteredEmployees = filters.unitIds.length > 0
    ? employees.filter(emp => filters.unitIds.includes(emp.unit_id || ''))
    : employees;

  return (
    <div className="bg-card border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          <span className="font-medium">Filters</span>
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="w-4 h-4 mr-1" />
            Reset to Current Month
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Date From */}
        <div className="space-y-2">
          <Label>From Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal",
                  !filters.dateRange.from && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.dateRange.from ? (
                  format(filters.dateRange.from, "PPP")
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={filters.dateRange.from}
                onSelect={(date) => updateFilters({
                  dateRange: { ...filters.dateRange, from: date }
                })}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Date To */}
        <div className="space-y-2">
          <Label>To Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal",
                  !filters.dateRange.to && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.dateRange.to ? (
                  format(filters.dateRange.to, "PPP")
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={filters.dateRange.to}
                onSelect={(date) => updateFilters({
                  dateRange: { ...filters.dateRange, to: date }
                })}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Unit Selection */}
        <div className="space-y-2">
          <Label>Unit</Label>
          <Select
            value={filters.unitIds[0] || FILTER_VALUES.ALL_UNITS}
            onValueChange={(value) => updateFilters({
              unitIds: value === FILTER_VALUES.ALL_UNITS ? [] : [value],
              // Clear employee filter when unit changes
              employeeIds: []
            })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select unit">
                {filters.unitIds.length === 0 ? (
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    All Units
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    {units.find(u => u.unit_id === filters.unitIds[0])?.unit_name || 'Select unit'}
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-md z-50">
              <SelectItem value={FILTER_VALUES.ALL_UNITS}>All Units</SelectItem>
              {unitsLoading ? (
                <div className="p-2 text-center text-muted-foreground">Loading units...</div>
              ) : units.length === 0 ? (
                <div className="p-2 text-center text-muted-foreground">No units found</div>
              ) : (
                units.map((unit) => (
                  <SelectItem key={unit.unit_id} value={unit.unit_id}>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      <span>{unit.unit_name}</span>
                      <span className="text-xs text-muted-foreground">({unit.unit_code})</span>
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Employee Selection */}
        <div className="space-y-2">
          <Label>Employee</Label>
          <Select
            value={filters.employeeIds[0] || FILTER_VALUES.ALL_EMPLOYEES}
            onValueChange={(value) => updateFilters({
              employeeIds: value === FILTER_VALUES.ALL_EMPLOYEES ? [] : [value]
            })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select employee" />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-md z-50">
              <SelectItem value={FILTER_VALUES.ALL_EMPLOYEES}>
                All Employees
                {filters.unitIds.length > 0 && (
                  <span className="text-xs text-muted-foreground ml-1">
                    ({filteredEmployees.length} in selected unit)
                  </span>
                )}
              </SelectItem>
              {filteredEmployees.map((employee) => (
                <SelectItem key={employee.id} value={employee.id}>
                  {employee.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Quick Date Ranges */}
        <div className="space-y-2">
          <Label>Quick Range</Label>
          <Select
            onValueChange={(value) => {
              const today = new Date();
              let from: Date | null = null;
              let to: Date | null = null;

              switch (value) {
                case QUICK_DATE_RANGES.TODAY:
                  from = to = today;
                  break;
                case QUICK_DATE_RANGES.WEEK:
                  from = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                  to = today;
                  break;
                case QUICK_DATE_RANGES.MONTH:
                  from = new Date(today.getFullYear(), today.getMonth(), 1);
                  to = today;
                  break;
                case QUICK_DATE_RANGES.QUARTER:
                  const quarterStart = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
                  from = quarterStart;
                  to = today;
                  break;
                case QUICK_DATE_RANGES.JUNE_2025:
                  from = new Date(2025, 5, 1);
                  to = new Date(2025, 5, 30);
                  break;
              }

              updateFilters({ dateRange: { from, to } });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Quick select" />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-md z-50">
              <SelectItem value={QUICK_DATE_RANGES.TODAY}>Today</SelectItem>
              <SelectItem value={QUICK_DATE_RANGES.WEEK}>Last 7 Days</SelectItem>
              <SelectItem value={QUICK_DATE_RANGES.MONTH}>This Month</SelectItem>
              <SelectItem value={QUICK_DATE_RANGES.QUARTER}>This Quarter</SelectItem>
              <SelectItem value={QUICK_DATE_RANGES.JUNE_2025}>June 2025</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {filters.dateRange.from && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-md">
              From: {format(filters.dateRange.from, "MMM dd")}
            </span>
          )}
          {filters.dateRange.to && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-md">
              To: {format(filters.dateRange.to, "MMM dd")}
            </span>
          )}
          {filters.unitIds.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-md">
              <Building2 className="w-3 h-3" />
              {units.find(u => u.unit_id === filters.unitIds[0])?.unit_name}
            </span>
          )}
          {filters.employeeIds.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-md">
              {employees.find(e => e.id === filters.employeeIds[0])?.name}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
