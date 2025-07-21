
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';
import { useReconciliationAnalytics } from './useReconciliationAnalytics';

interface LeaveBalanceTrendingProps {
  month: number;
  year: number;
  unitId?: string;
}

export const LeaveBalanceTrending: React.FC<LeaveBalanceTrendingProps> = ({ month, year, unitId }) => {
  const { analytics, loading } = useReconciliationAnalytics({ month, year, unitId });

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getTrendIcon = (frequency: number) => {
    if (frequency > 3) return <TrendingUp className="h-4 w-4 text-red-500" />;
    if (frequency > 1) return <TrendingDown className="h-4 w-4 text-yellow-500" />;
    return <Minus className="h-4 w-4 text-green-500" />;
  };

  const getTrendBadge = (frequency: number) => {
    if (frequency > 3) return <Badge variant="destructive">High Risk</Badge>;
    if (frequency > 1) return <Badge variant="secondary">Medium Risk</Badge>;
    return <Badge variant="default">Low Risk</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Employee Leave Balance Analysis</CardTitle>
          <CardDescription>
            Individual employee leave balance trends and adjustment patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {analytics?.employeeBalanceTrends?.length || 0}
                </div>
                <div className="text-sm text-muted-foreground">Total Employees</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {analytics?.employeeBalanceTrends?.filter(e => e.adjustment_frequency > 3).length || 0}
                </div>
                <div className="text-sm text-muted-foreground">High Risk Employees</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {analytics?.employeeBalanceTrends?.filter(e => e.adjustment_frequency <= 1).length || 0}
                </div>
                <div className="text-sm text-muted-foreground">Low Risk Employees</div>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Casual Leave</TableHead>
                  <TableHead>Earned Leave</TableHead>
                  <TableHead>Adjustment Frequency</TableHead>
                  <TableHead>Risk Level</TableHead>
                  <TableHead>Trend</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics?.employeeBalanceTrends?.map((employee) => (
                  <TableRow key={employee.employee_id}>
                    <TableCell className="font-medium">
                      {employee.employee_name}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className="w-16">
                          <Progress value={(employee.casual_balance_trend[0] / 12) * 100} className="h-2" />
                        </div>
                        <span className="text-sm">{employee.casual_balance_trend[0]}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className="w-16">
                          <Progress value={(employee.earned_balance_trend[0] / 21) * 100} className="h-2" />
                        </div>
                        <span className="text-sm">{employee.earned_balance_trend[0]}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">{employee.adjustment_frequency}</span>
                        {employee.adjustment_frequency > 3 && (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getTrendBadge(employee.adjustment_frequency)}
                    </TableCell>
                    <TableCell>
                      {getTrendIcon(employee.adjustment_frequency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Leave Pattern Insights</CardTitle>
          <CardDescription>Key patterns and recommendations based on analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">High Risk Employees</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Employees requiring frequent adjustments
              </p>
              <ul className="text-sm space-y-1">
                {analytics?.employeeBalanceTrends
                  ?.filter(e => e.adjustment_frequency > 3)
                  .slice(0, 5)
                  .map(employee => (
                    <li key={employee.employee_id} className="flex items-center space-x-2">
                      <AlertCircle className="h-3 w-3 text-red-500" />
                      <span>{employee.employee_name}</span>
                    </li>
                  ))}
              </ul>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Recommendations</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Actions to improve leave management
              </p>
              <ul className="text-sm space-y-1">
                <li>• Review attendance policies for high-risk employees</li>
                <li>• Implement proactive leave tracking</li>
                <li>• Consider automated leave calculations</li>
                <li>• Regular balance reconciliation training</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
