
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Filter, X } from 'lucide-react';

interface SmartFiltersProps {
  onFilterChange: (filters: FilterCriteria) => void;
  onClearFilters: () => void;
  activeFilters: FilterCriteria;
}

export interface FilterCriteria {
  discrepancyThreshold: number;
  adjustmentType: 'all' | 'positive' | 'negative';
  leaveType: 'all' | 'casual' | 'earned';
  minAdjustmentAmount: number;
  maxAdjustmentAmount: number;
}

export const SmartFilters: React.FC<SmartFiltersProps> = ({
  onFilterChange,
  onClearFilters,
  activeFilters,
}) => {
  const handleFilterChange = (key: keyof FilterCriteria, value: any) => {
    const newFilters = { ...activeFilters, [key]: value };
    onFilterChange(newFilters);
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Smart Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="discrepancy-threshold">Discrepancy Threshold (days)</Label>
            <Input
              id="discrepancy-threshold"
              type="number"
              value={activeFilters.discrepancyThreshold}
              onChange={(e) => handleFilterChange('discrepancyThreshold', Number(e.target.value))}
              placeholder="e.g., 2"
            />
          </div>

          <div>
            <Label htmlFor="adjustment-type">Adjustment Type</Label>
            <Select
              value={activeFilters.adjustmentType}
              onValueChange={(value) => handleFilterChange('adjustmentType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select adjustment type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Adjustments</SelectItem>
                <SelectItem value="positive">Positive Adjustments</SelectItem>
                <SelectItem value="negative">Negative Adjustments</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="leave-type">Leave Type</Label>
            <Select
              value={activeFilters.leaveType}
              onValueChange={(value) => handleFilterChange('leaveType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select leave type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Leave Types</SelectItem>
                <SelectItem value="casual">Casual Leave</SelectItem>
                <SelectItem value="earned">Earned Leave</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="min-adjustment">Min Adjustment Amount</Label>
            <Input
              id="min-adjustment"
              type="number"
              value={activeFilters.minAdjustmentAmount}
              onChange={(e) => handleFilterChange('minAdjustmentAmount', Number(e.target.value))}
              placeholder="Minimum adjustment"
            />
          </div>

          <div>
            <Label htmlFor="max-adjustment">Max Adjustment Amount</Label>
            <Input
              id="max-adjustment"
              type="number"
              value={activeFilters.maxAdjustmentAmount}
              onChange={(e) => handleFilterChange('maxAdjustmentAmount', Number(e.target.value))}
              placeholder="Maximum adjustment"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={onClearFilters} variant="outline" size="sm">
            <X className="h-4 w-4 mr-1" />
            Clear Filters
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
