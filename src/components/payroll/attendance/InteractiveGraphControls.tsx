
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, BarChart3, LineChart, PieChart, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useUnitsData } from '@/hooks/useUnitsData';
import { GraphFilters } from '@/hooks/useGraphData';
import { FILTER_VALUES, CHART_TYPES, TIME_PERIODS } from '@/config/constants';
import type { ChartType, TimePeriod } from '@/config/types';

interface InteractiveGraphControlsProps {
  filters: GraphFilters;
  onFiltersChange: (filters: GraphFilters) => void;
}

export const InteractiveGraphControls: React.FC<InteractiveGraphControlsProps> = ({
  filters,
  onFiltersChange
}) => {
  const { units, loading: unitsLoading } = useUnitsData();

  const updateFilters = (updates: Partial<GraphFilters>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const setQuickDateRange = (days: number) => {
    const today = new Date();
    const from = new Date(today.getTime() - days * 24 * 60 * 60 * 1000);
    updateFilters({
      dateRange: { from, to: today }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Interactive Analytics Controls
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Unit Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Units</label>
            <Select
              value={filters.unitIds[0] || FILTER_VALUES.ALL_UNITS}
              onValueChange={(value) => updateFilters({
                unitIds: value === FILTER_VALUES.ALL_UNITS ? [] : [value]
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select units" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={FILTER_VALUES.ALL_UNITS}>All Units</SelectItem>
                {units.map((unit) => (
                  <SelectItem key={unit.unit_id} value={unit.unit_id}>
                    {unit.unit_name} ({unit.unit_code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Chart Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Chart Type</label>
            <Select
              value={filters.chartType}
              onValueChange={(value: ChartType) => updateFilters({ chartType: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={CHART_TYPES.LINE}>
                  <div className="flex items-center gap-2">
                    <LineChart className="w-4 h-4" />
                    Line Chart
                  </div>
                </SelectItem>
                <SelectItem value={CHART_TYPES.BAR}>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Bar Chart
                  </div>
                </SelectItem>
                <SelectItem value={CHART_TYPES.STACKED}>
                  <div className="flex items-center gap-2">
                    <PieChart className="w-4 h-4" />
                    Stacked Chart
                  </div>
                </SelectItem>
                <SelectItem value={CHART_TYPES.COMPARISON}>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Comparison
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Period */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Period</label>
            <Select
              value={filters.period}
              onValueChange={(value: TimePeriod) => updateFilters({ period: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TIME_PERIODS.DAILY}>Daily</SelectItem>
                <SelectItem value={TIME_PERIODS.WEEKLY}>Weekly</SelectItem>
                <SelectItem value={TIME_PERIODS.MONTHLY}>Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Date Range</label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "flex-1 justify-start text-left font-normal",
                      !filters.dateRange.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateRange.from ? (
                      format(filters.dateRange.from, "MMM dd")
                    ) : (
                      <span>From</span>
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

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "flex-1 justify-start text-left font-normal",
                      !filters.dateRange.to && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateRange.to ? (
                      format(filters.dateRange.to, "MMM dd")
                    ) : (
                      <span>To</span>
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
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-4 space-y-2">
          <label className="text-sm font-medium">Quick Date Selection</label>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setQuickDateRange(7)}>
              Last 7 Days
            </Button>
            <Button variant="outline" size="sm" onClick={() => setQuickDateRange(30)}>
              Last 30 Days
            </Button>
            <Button variant="outline" size="sm" onClick={() => setQuickDateRange(90)}>
              Last 3 Months
            </Button>
          </div>
        </div>

        {/* Unit Quick Select */}
        <div className="mt-4 space-y-2">
          <label className="text-sm font-medium">Quick Unit Selection</label>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => updateFilters({ unitIds: [] })}
            >
              All Units
            </Button>
            {units.filter(u => u.unit_code?.includes('PKL')).map(unit => (
              <Button 
                key={unit.unit_id}
                variant="outline" 
                size="sm" 
                onClick={() => updateFilters({ unitIds: [unit.unit_id] })}
              >
                {unit.unit_code}
              </Button>
            ))}
            {units.filter(u => u.unit_code?.includes('SE')).map(unit => (
              <Button 
                key={unit.unit_id}
                variant="outline" 
                size="sm" 
                onClick={() => updateFilters({ unitIds: [unit.unit_id] })}
              >
                {unit.unit_code}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
