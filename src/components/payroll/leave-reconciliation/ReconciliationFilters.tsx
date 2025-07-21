
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { Unit } from './types';

interface ReconciliationFiltersProps {
  selectedMonth: number;
  selectedYear: number;
  selectedUnit: string;
  adjustmentReason: string;
  loading: boolean;
  units: Unit[];
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  onUnitChange: (unit: string) => void;
  onReasonChange: (reason: string) => void;
  onReconcile: () => void;
}

export const ReconciliationFilters: React.FC<ReconciliationFiltersProps> = ({
  selectedMonth,
  selectedYear,
  selectedUnit,
  adjustmentReason,
  loading,
  units,
  onMonthChange,
  onYearChange,
  onUnitChange,
  onReasonChange,
  onReconcile,
}) => {
  const months = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
    { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
    { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' }
  ];

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <Label htmlFor="month">Month</Label>
          <Select value={selectedMonth.toString()} onValueChange={(value) => onMonthChange(parseInt(value))}>
            <SelectTrigger>
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {months.map(month => (
                <SelectItem key={month.value} value={month.value.toString()}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="year">Year</Label>
          <Select value={selectedYear.toString()} onValueChange={(value) => onYearChange(parseInt(value))}>
            <SelectTrigger>
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {years.map(year => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="unit">Unit (Optional)</Label>
          <Select value={selectedUnit} onValueChange={onUnitChange}>
            <SelectTrigger>
              <SelectValue placeholder="All units" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Units</SelectItem>
              {units.map(unit => (
                <SelectItem key={unit.unit_id} value={unit.unit_id}>
                  {unit.unit_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end">
          <Button onClick={onReconcile} disabled={loading} className="w-full">
            {loading ? 'Processing...' : 'Calculate Reconciliation'}
          </Button>
        </div>
      </div>

      <div>
        <Label htmlFor="reason">Adjustment Reason</Label>
        <Input
          id="reason"
          value={adjustmentReason}
          onChange={(e) => onReasonChange(e.target.value)}
          placeholder="Enter reason for leave balance adjustments"
        />
      </div>
    </div>
  );
};
