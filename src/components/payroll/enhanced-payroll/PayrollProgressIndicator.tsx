
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface PayrollProgressIndicatorProps {
  progress: {
    current: number;
    total: number;
    currentEmployee: string;
    completedEmployees: string[];
    failedEmployees: Array<{
      employee_id: string;
      employee_name: string;
      error: string;
    }>;
  };
  isCalculating: boolean;
  canCancel: boolean;
  onCancel: () => void;
}

export const PayrollProgressIndicator: React.FC<PayrollProgressIndicatorProps> = ({
  progress,
  isCalculating,
  canCancel,
  onCancel
}) => {
  const progressPercentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  if (!isCalculating && progress.current === 0) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <CardTitle>Payroll Calculation Progress</CardTitle>
            <Badge variant={isCalculating ? "default" : "secondary"}>
              {isCalculating ? 'Processing' : 'Completed'}
            </Badge>
          </div>
          {canCancel && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onCancel}
              className="text-red-600 hover:text-red-700"
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          )}
        </div>
        <CardDescription>
          {isCalculating 
            ? `Processing ${progress.current} of ${progress.total} employees...`
            : `Completed processing ${progress.current} of ${progress.total} employees`
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Progress</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="w-full" />
          </div>

          {progress.currentEmployee && (
            <div className="text-sm text-muted-foreground">
              Currently processing: <span className="font-medium">{progress.currentEmployee}</span>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Completed: {progress.completedEmployees.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span>Failed: {progress.failedEmployees.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span>Remaining: {progress.total - progress.current}</span>
            </div>
          </div>

          {progress.failedEmployees.length > 0 && (
            <div className="mt-4 p-3 bg-red-50 rounded-md">
              <div className="text-sm font-medium text-red-800 mb-2">
                Failed Calculations ({progress.failedEmployees.length})
              </div>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {progress.failedEmployees.map((failure, index) => (
                  <div key={index} className="text-xs text-red-700">
                    <span className="font-medium">{failure.employee_name}</span>: {failure.error}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
