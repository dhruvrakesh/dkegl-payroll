
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, TrendingUp, Users, AlertTriangle, CheckCircle, Clock, FileText, Download } from 'lucide-react';
import { useReconciliationStatus } from '@/hooks/useReconciliationStatus';
import { useReconciliationAnalytics } from './dashboard/useReconciliationAnalytics';
import { ReconciliationStatusIndicator } from './dashboard/ReconciliationStatusIndicator';
import { ReconciliationTrends } from './dashboard/ReconciliationTrends';
import { LeaveBalanceTrending } from './dashboard/LeaveBalanceTrending';
import { ReconciliationReports } from './dashboard/ReconciliationReports';

export const ReconciliationDashboard = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedUnit, setSelectedUnit] = useState<string>('all');

  const { reconciliationStatus, loading, checkReconciliationStatus } = useReconciliationStatus();
  const { analytics, loading: analyticsLoading } = useReconciliationAnalytics({
    month: selectedMonth,
    year: selectedYear,
    unitId: selectedUnit === 'all' ? undefined : selectedUnit
  });

  useEffect(() => {
    checkReconciliationStatus(selectedMonth, selectedYear, selectedUnit === 'all' ? undefined : selectedUnit);
  }, [selectedMonth, selectedYear, selectedUnit]);

  const currentMonthStatus = reconciliationStatus.find(status => status.reconciliation_id);
  const completionRate = analytics?.completionRate || 0;
  const totalAdjustments = analytics?.totalAdjustments || 0;
  const affectedEmployees = analytics?.affectedEmployees || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reconciliation Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor leave reconciliation status and analytics
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => (
                <SelectItem key={i + 1} value={(i + 1).toString()}>
                  {new Date(0, i).toLocaleDateString('default', { month: 'long' })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 5 }, (_, i) => (
                <SelectItem key={2020 + i} value={(2020 + i).toString()}>
                  {2020 + i}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Status Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reconciliation Status</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <ReconciliationStatusIndicator
                status={currentMonthStatus?.is_completed}
                size="lg"
              />
              <div>
                <div className="text-2xl font-bold">
                  {currentMonthStatus?.is_completed ? 'Complete' : 'Pending'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {currentMonthStatus?.reconciliation_date 
                    ? `Completed ${new Date(currentMonthStatus.reconciliation_date).toLocaleDateString()}`
                    : 'Not completed yet'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate.toFixed(1)}%</div>
            <Progress value={completionRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Last 6 months average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Adjustments</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAdjustments}</div>
            <p className="text-xs text-muted-foreground">
              {affectedEmployees} employees affected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.avgProcessingTime || 0}</div>
            <p className="text-xs text-muted-foreground">
              Average minutes to complete
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="employees">Employee Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Reconciliation Status</CardTitle>
                <CardDescription>
                  Current status and recent activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reconciliationStatus.map((status) => (
                    <div key={status.reconciliation_id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <ReconciliationStatusIndicator status={status.is_completed} />
                        <div>
                          <div className="font-medium">{status.unit_name || 'All Units'}</div>
                          <div className="text-sm text-muted-foreground">
                            {status.total_employees} employees, {status.employees_adjusted} adjusted
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{status.total_adjustments} adjustments</div>
                        <div className="text-xs text-muted-foreground">
                          {status.reconciliation_date && new Date(status.reconciliation_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common reconciliation tasks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button className="w-full justify-start" variant="outline">
                    <Calendar className="mr-2 h-4 w-4" />
                    Start New Reconciliation
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Users className="mr-2 h-4 w-4" />
                    View Employee Balances
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Report
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends">
          <ReconciliationTrends 
            month={selectedMonth} 
            year={selectedYear} 
            unitId={selectedUnit === 'all' ? undefined : selectedUnit}
          />
        </TabsContent>

        <TabsContent value="employees">
          <LeaveBalanceTrending 
            month={selectedMonth} 
            year={selectedYear} 
            unitId={selectedUnit === 'all' ? undefined : selectedUnit}
          />
        </TabsContent>

        <TabsContent value="reports">
          <ReconciliationReports 
            month={selectedMonth} 
            year={selectedYear} 
            unitId={selectedUnit === 'all' ? undefined : selectedUnit}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
