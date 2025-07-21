
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, TrendingDown, Minus, AlertCircle, Users, Target, Award } from 'lucide-react';
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

  const hasEmployeeData = analytics?.employeeBalanceTrends && analytics.employeeBalanceTrends.length > 0;

  const getTrendIcon = (frequency: number) => {
    if (frequency > 5) return <TrendingUp className="h-4 w-4 text-red-500" />;
    if (frequency > 2) return <TrendingDown className="h-4 w-4 text-yellow-500" />;
    return <Minus className="h-4 w-4 text-green-500" />;
  };

  const getTrendBadge = (frequency: number) => {
    if (frequency > 5) return <Badge variant="destructive">High Risk</Badge>;
    if (frequency > 2) return <Badge variant="secondary">Medium Risk</Badge>;
    return <Badge variant="default">Low Risk</Badge>;
  };

  const getRiskColor = (frequency: number) => {
    if (frequency > 5) return 'text-red-600';
    if (frequency > 2) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (!hasEmployeeData) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              No Employee Leave Balance Data
            </CardTitle>
            <CardDescription>
              No employee leave balance data available for analysis. Complete leave reconciliation to see employee trends.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 mb-4">
                To see employee leave balance trends, you need to:
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Set up employee leave balances</li>
                <li>• Process leave adjustments</li>
                <li>• Complete reconciliation for employees</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const highRiskEmployees = analytics.employeeBalanceTrends.filter(e => e.adjustment_frequency > 5);
  const mediumRiskEmployees = analytics.employeeBalanceTrends.filter(e => e.adjustment_frequency > 2 && e.adjustment_frequency <= 5);
  const lowRiskEmployees = analytics.employeeBalanceTrends.filter(e => e.adjustment_frequency <= 2);

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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {analytics.employeeBalanceTrends.length}
                </div>
                <div className="text-sm text-muted-foreground">Total Employees</div>
                <div className="text-xs text-gray-500 mt-1">
                  With leave balances
                </div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {highRiskEmployees.length}
                </div>
                <div className="text-sm text-muted-foreground">High Risk</div>
                <div className="text-xs text-gray-500 mt-1">
                  5+ adjustments
                </div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {mediumRiskEmployees.length}
                </div>
                <div className="text-sm text-muted-foreground">Medium Risk</div>
                <div className="text-xs text-gray-500 mt-1">
                  3-5 adjustments
                </div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {lowRiskEmployees.length}
                </div>
                <div className="text-sm text-muted-foreground">Low Risk</div>
                <div className="text-xs text-gray-500 mt-1">
                  ≤2 adjustments
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Casual Leave</TableHead>
                    <TableHead>Earned Leave</TableHead>
                    <TableHead>Adjustment Frequency</TableHead>
                    <TableHead>Risk Level</TableHead>
                    <TableHead>Trend</TableHead>
                    <TableHead>Total Adjustments</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.employeeBalanceTrends
                    .sort((a, b) => b.adjustment_frequency - a.adjustment_frequency)
                    .map((employee) => (
                    <TableRow key={employee.employee_id}>
                      <TableCell className="font-medium">
                        {employee.employee_name}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="w-16">
                            <Progress 
                              value={Math.min((employee.current_casual_balance / 12) * 100, 100)} 
                              className="h-2" 
                            />
                          </div>
                          <span className="text-sm">{employee.current_casual_balance}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="w-16">
                            <Progress 
                              value={Math.min((employee.current_earned_balance / 21) * 100, 100)} 
                              className="h-2" 
                            />
                          </div>
                          <span className="text-sm">{employee.current_earned_balance}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">{employee.adjustment_frequency}</span>
                          {employee.adjustment_frequency > 5 && (
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
                      <TableCell>
                        <span className={`text-sm font-medium ${getRiskColor(employee.adjustment_frequency)}`}>
                          {employee.total_adjustments.toFixed(1)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-red-500" />
              High Risk Employees
            </CardTitle>
            <CardDescription>Employees requiring frequent adjustments (5+ times)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {highRiskEmployees.length > 0 ? (
                highRiskEmployees.slice(0, 5).map(employee => (
                  <div key={employee.employee_id} className="flex items-center justify-between p-3 border rounded-lg border-red-200">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <span className="font-medium">{employee.employee_name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-red-600">
                        {employee.adjustment_frequency} adjustments
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ₹{employee.total_adjustments.toFixed(0)} total
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <Award className="mx-auto h-8 w-8 text-green-500 mb-2" />
                  <p className="text-sm text-green-600">No high-risk employees found!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              Recommendations
            </CardTitle>
            <CardDescription>Actions to improve leave management</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-1">For High Risk Employees:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Review attendance policies and enforcement</li>
                  <li>• Implement proactive leave counseling</li>
                  <li>• Consider performance improvement plans</li>
                </ul>
              </div>
              
              <div className="p-3 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-1">System Improvements:</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• Automated leave balance alerts</li>
                  <li>• Regular reconciliation scheduling</li>
                  <li>• Enhanced reporting and analytics</li>
                </ul>
              </div>

              <div className="p-3 bg-purple-50 rounded-lg">
                <h4 className="font-semibold text-purple-900 mb-1">Process Optimization:</h4>
                <ul className="text-sm text-purple-800 space-y-1">
                  <li>• Standardize leave calculation methods</li>
                  <li>• Implement approval workflows</li>
                  <li>• Regular data quality audits</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
