
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useReconciliationAnalytics } from './useReconciliationAnalytics';

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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Completion Rate Trend</CardTitle>
            <CardDescription>Monthly reconciliation completion percentage</CardDescription>
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
                <LineChart data={analytics?.trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
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
            <CardTitle>Adjustment Volume</CardTitle>
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
                <BarChart data={analytics?.trendData}>
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
          <CardTitle>Reconciliation Metrics Summary</CardTitle>
          <CardDescription>Key performance indicators for reconciliation process</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {analytics?.completionRate.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Average Completion Rate</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {analytics?.totalAdjustments}
              </div>
              <div className="text-sm text-muted-foreground">Total Adjustments</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {analytics?.avgProcessingTime.toFixed(0)} min
              </div>
              <div className="text-sm text-muted-foreground">Avg Processing Time</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
