
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useReconciliationAnalytics } from './useReconciliationAnalytics';
import { AlertCircle, TrendingUp, Calendar, Users } from 'lucide-react';

interface ReconciliationTrendsProps {
  month: number;
  year: number;
  unitId?: string;
}

export const ReconciliationTrends: React.FC<ReconciliationTrendsProps> = ({ month, year, unitId }) => {
  const { analytics, loading } = useReconciliationAnalytics({ month, year, unitId });

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasData = analytics && (analytics.trendData.length > 0 || analytics.totalAdjustments > 0);

  if (!hasData) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              No Reconciliation Data Available
            </CardTitle>
            <CardDescription>
              No reconciliation data found for the selected period. Start by performing leave reconciliation to see analytics.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 mb-4">
                To see reconciliation trends, you need to:
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Perform leave reconciliation for at least one month</li>
                <li>• Apply leave adjustments to employees</li>
                <li>• Complete reconciliation process</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Completion Rate Trend</CardTitle>
            <CardDescription>Monthly reconciliation completion percentage over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                completionRate: {
                  label: 'Completion Rate',
                  color: 'hsl(var(--chart-1))',
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics?.trendData || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    formatter={(value: any) => [`${value}%`, 'Completion Rate']}
                  />
                  <Line
                    type="monotone"
                    dataKey="completionRate"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--chart-1))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Adjustment Activity</CardTitle>
            <CardDescription>Monthly adjustments and affected employees</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                adjustments: {
                  label: 'Adjustments',
                  color: 'hsl(var(--chart-2))',
                },
                employees: {
                  label: 'Employees',
                  color: 'hsl(var(--chart-3))',
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics?.trendData || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="adjustments" fill="hsl(var(--chart-2))" />
                  <Bar dataKey="employees" fill="hsl(var(--chart-3))" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reconciliation Performance Summary</CardTitle>
          <CardDescription>Key metrics and performance indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {analytics?.completionRate?.toFixed(1) || 0}%
              </div>
              <div className="text-sm text-muted-foreground">Overall Completion Rate</div>
              <div className="text-xs text-gray-500 mt-1">
                Last 12 months average
              </div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {analytics?.totalAdjustments || 0}
              </div>
              <div className="text-sm text-muted-foreground">Total Adjustments</div>
              <div className="text-xs text-gray-500 mt-1">
                Current period
              </div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {analytics?.affectedEmployees || 0}
              </div>
              <div className="text-sm text-muted-foreground">Employees Affected</div>
              <div className="text-xs text-gray-500 mt-1">
                With leave adjustments
              </div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {analytics?.avgProcessingTime?.toFixed(0) || 0} min
              </div>
              <div className="text-sm text-muted-foreground">Avg Processing Time</div>
              <div className="text-xs text-gray-500 mt-1">
                Per reconciliation
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {analytics?.reconciliationHistory && analytics.reconciliationHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Reconciliation History
            </CardTitle>
            <CardDescription>Recent reconciliation activities and completion status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.reconciliationHistory.slice(0, 5).map((history, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    <div>
                      <div className="font-medium">{history.month} {history.year}</div>
                      <div className="text-sm text-muted-foreground">
                        {history.unit_name}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {history.employees_adjusted} / {history.total_employees} employees
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(history.completion_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
