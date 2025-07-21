
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, CheckSquare, Square, Filter, Eye } from 'lucide-react';
import type { ReconciliationData } from './types';

interface BulkSelectionToolsProps {
  reconciliationData: ReconciliationData[];
  selectedEmployees: string[];
  onSelectAll: () => void;
  onClearAll: () => void;
  onSelectByDiscrepancy: (threshold: number) => void;
  onSelectByAdjustmentType: (type: 'positive' | 'negative') => void;
  onPreviewSelected: () => void;
}

export const BulkSelectionTools: React.FC<BulkSelectionToolsProps> = ({
  reconciliationData,
  selectedEmployees,
  onSelectAll,
  onClearAll,
  onSelectByDiscrepancy,
  onSelectByAdjustmentType,
  onPreviewSelected,
}) => {
  const [discrepancyThreshold, setDiscrepancyThreshold] = React.useState(2);

  const employeesWithAdjustments = reconciliationData.filter(emp => 
    emp.suggested_adjustment.casual_adjustment !== 0 || 
    emp.suggested_adjustment.earned_adjustment !== 0
  );

  const positiveAdjustments = employeesWithAdjustments.filter(emp => 
    emp.suggested_adjustment.casual_adjustment > 0 || 
    emp.suggested_adjustment.earned_adjustment > 0
  ).length;

  const negativeAdjustments = employeesWithAdjustments.filter(emp => 
    emp.suggested_adjustment.casual_adjustment < 0 || 
    emp.suggested_adjustment.earned_adjustment < 0
  ).length;

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Bulk Selection Tools
          <Badge variant="secondary">{selectedEmployees.length} selected</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{employeesWithAdjustments.length}</p>
              <p className="text-sm text-blue-800">Need Adjustment</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{positiveAdjustments}</p>
              <p className="text-sm text-green-800">Positive</p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">{negativeAdjustments}</p>
              <p className="text-sm text-red-800">Negative</p>
            </div>
          </div>

          {/* Basic Selection */}
          <div className="flex flex-wrap gap-2">
            <Button onClick={onSelectAll} variant="outline" size="sm">
              <CheckSquare className="h-4 w-4 mr-1" />
              Select All
            </Button>
            <Button onClick={onClearAll} variant="outline" size="sm">
              <Square className="h-4 w-4 mr-1" />
              Clear All
            </Button>
            <Button 
              onClick={() => onSelectByAdjustmentType('positive')} 
              variant="outline" 
              size="sm"
              className="text-green-600 border-green-200"
            >
              <CheckSquare className="h-4 w-4 mr-1" />
              Select Positive
            </Button>
            <Button 
              onClick={() => onSelectByAdjustmentType('negative')} 
              variant="outline" 
              size="sm"
              className="text-red-600 border-red-200"
            >
              <CheckSquare className="h-4 w-4 mr-1" />
              Select Negative
            </Button>
          </div>

          {/* Advanced Selection */}
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Label htmlFor="discrepancy-threshold">Select by Discrepancy Threshold</Label>
              <Input
                id="discrepancy-threshold"
                type="number"
                value={discrepancyThreshold}
                onChange={(e) => setDiscrepancyThreshold(Number(e.target.value))}
                placeholder="Days"
                min="1"
                max="10"
              />
            </div>
            <Button 
              onClick={() => onSelectByDiscrepancy(discrepancyThreshold)}
              variant="outline"
              size="sm"
            >
              <Filter className="h-4 w-4 mr-1" />
              Apply Filter
            </Button>
          </div>

          {/* Preview Button */}
          <div className="flex justify-end">
            <Button 
              onClick={onPreviewSelected}
              disabled={selectedEmployees.length === 0}
              variant="default"
            >
              <Eye className="h-4 w-4 mr-1" />
              Preview Changes ({selectedEmployees.length})
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
