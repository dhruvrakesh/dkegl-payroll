
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Filter, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface AttendanceFilters {
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  employeeIds: string[];
  unitIds: string[];
}

interface Employee {
  id: string;
  name: string;
}

interface AttendanceFiltersProps {
  filters: AttendanceFilters;
  onFiltersChange: (filters: AttendanceFilters) => void;
  employees: Employee[];
}

export const AttendanceFilters: React.FC<AttendanceFiltersProps> = ({
  filters,
  onFiltersChange,
  employees
}) => {
  const updateFilters = (updates: Partial<AttendanceFilters>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const clearFilters = () => {
    onFiltersChange({
      dateRange: { from: null, to: null },
      employeeIds: [],
      unitIds: []
    });
  };

  const hasActiveFilters = 
    filters.dateRange.from || 
    filters.dateRange.to || 
    filters.employeeIds.length > 0 || 
    filters.unitIds.length > 0;

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
            Clear All
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

        {/* Employee Selection */}
        <div className="space-y-2">
          <Label>Employee</Label>
          <Select
            value={filters.employeeIds[0] || ""}
            onValueChange={(value) => updateFilters({
              employeeIds: value ? [value] : []
            })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select employee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Employees</SelectItem>
              {employees.map((employee) => (
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
                case 'today':
                  from = to = today;
                  break;
                case 'week':
                  from = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                  to = today;
                  break;
                case 'month':
                  from = new Date(today.getFullYear(), today.getMonth(), 1);
                  to = today;
                  break;
                case 'quarter':
                  const quarterStart = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
                  from = quarterStart;
                  to = today;
                  break;
              }

              updateFilters({ dateRange: { from, to } });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Quick select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
