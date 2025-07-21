
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download, Calendar, TrendingUp, Users, AlertTriangle, CheckCircle } from 'lucide-react';
import { useReconciliationAnalytics } from './useReconciliationAnalytics';

interface ReconciliationReportsProps {
  month: number;
  year: number;
  unitId?: string;
}

export const ReconciliationReports: React.FC<ReconciliationReportsProps> = ({ month, year, unitId }) => {
  const { analytics, loading } = useReconciliationAnalytics({ month, year, unitId });
  const [selectedReport, setSelectedReport] = useState<string>('summary');

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasData = analytics && (
    analytics.reconciliationHistory.length > 0 || 
    analytics.employeeBalanceTrends.length > 0 ||
    analytics.totalAdjustments > 0
  );

  const generateReport = (type: string) => {
    console.log(`Generating ${type} report for period ${month}/${year}`);
    // In a real implementation, this would call an API to generate and download the report
    alert(`${type} report generation feature will be implemented in the next phase`);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Reconciliation Reports
          </CardTitle>
          <CardDescription>
            Generate and download reconciliation reports and analytics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Select value={selectedReport} onValueChange={setSelectedReport}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="summary">Summary Report</SelectItem>
                    <SelectItem value="detailed">Detailed Analysis</SelectItem>
                    <SelectItem value="employee">Employee Report</SelectItem>
                    <SelectItem value="trends">Trends Report</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={() => generateReport(selectedReport)} className="gap-2">
                  <Download className="h-4 w-4" />
                  Generate Report
                </Button>
              </div>
            </div>

            {!hasData ? (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500 mb-4">
                  No data available for report generation
                </p>
                <p className="text-sm text-gray-600">
                  Complete reconciliation activities to generate meaningful reports
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-muted-foreground">Available Reports</div>
                        <div className="text-2xl font-bold">4</div>
                      </div>
                      <FileText className="h-8 w-8 text-blue-500" />
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-muted-foreground">Data Period</div>
                        <div className="text-2xl font-bold">{month}/{year}</div>
                      </div>
                      <Calendar className="h-8 w-8 text-green-500" />
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-muted-foreground">Last Updated</div>
                        <div className="text-2xl font-bold">Today</div>
                      </div>
                      <CheckCircle className="h-8 w-8 text-purple-500" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {analytics?.reconciliationHistory && analytics.reconciliationHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Reconciliation History</CardTitle>
            <CardDescription>Recent reconciliation activities and completion status</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Total Employees</TableHead>
                  <TableHead>Employees Adjusted</TableHead>
                  <TableHead>Completion Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.reconciliationHistory.map((history, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {history.month} {history.year}
                    </TableCell>
                    <TableCell>{history.unit_name}</TableCell>
                    <TableCell>{history.total_employees}</TableCell>
                    <TableCell>{history.employees_adjusted}</TableCell>
                    <TableCell>
                      {new Date(history.completion_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Completed
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {analytics?.employeeBalanceTrends && analytics.employeeBalanceTrends.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Employee Risk Assessment</CardTitle>
            <CardDescription>Summary of employee risk levels based on adjustment frequency</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg border-red-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-red-600">High Risk</div>
                      <div className="text-2xl font-bold text-red-700">
                        {analytics.employeeBalanceTrends.filter(e => e.adjustment_frequency > 5).length}
                      </div>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-red-500" />
                  </div>
                </div>
                <div className="p-4 border rounded-lg border-yellow-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-yellow-600">Medium Risk</div>
                      <div className="text-2xl font-bold text-yellow-700">
                        {analytics.employeeBalanceTrends.filter(e => e.adjustment_frequency > 2 && e.adjustment_frequency <= 5).length}
                      </div>
                    </div>
                    <TrendingUp className="h-8 w-8 text-yellow-500" />
                  </div>
                </div>
                <div className="p-4 border rounded-lg border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-green-600">Low Risk</div>
                      <div className="text-2xl font-bold text-green-700">
                        {analytics.employeeBalanceTrends.filter(e => e.adjustment_frequency <= 2).length}
                      </div>
                    </div>
                    <Users className="h-8 w-8 text-green-500" />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Report Recommendations:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Focus on high-risk employees for policy review</li>
                  <li>• Implement preventive measures for medium-risk employees</li>
                  <li>• Use low-risk employees as best practice examples</li>
                  <li>• Schedule regular reconciliation reviews</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
