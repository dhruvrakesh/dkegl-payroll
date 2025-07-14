
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { GraphFilters, useGraphData } from '@/hooks/useGraphData';

interface InteractiveGraphViewProps {
  filters: GraphFilters;
}

export const InteractiveGraphView: React.FC<InteractiveGraphViewProps> = ({ filters }) => {
  const { graphData, loading } = useGraphData(filters);

  const chartConfig = {
    totalHours: {
      label: "Total Hours",
      color: "hsl(var(--chart-1))"
    },
    employeeCount: {
      label: "Employee Count",
      color: "hsl(var(--chart-2))"
    },
    utilizationRate: {
      label: "Utilization Rate",
      color: "hsl(var(--chart-3))"
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Graph Data...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderChart = () => {
    switch (filters.chartType) {
      case 'line':
        return (
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={graphData.trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line 
                  type="monotone" 
                  dataKey="totalHours" 
                  stroke="var(--color-totalHours)" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        );

      case 'bar':
        return (
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={graphData.unitComparison}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="unitName" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="totalHours" fill="var(--color-totalHours)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        );

      case 'stacked':
        return (
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={graphData.unitComparison}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="unitName" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="totalHours" stackId="a" fill="var(--color-totalHours)" />
                <Bar dataKey="employeeCount" stackId="a" fill="var(--color-employeeCount)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        );

      case 'comparison':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Unit Hours Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig}>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={graphData.unitComparison}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="unitName" angle={-45} textAnchor="end" height={60} />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="totalHours" fill="var(--color-totalHours)" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Utilization Rates</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig}>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={graphData.unitComparison}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="unitName" angle={-45} textAnchor="end" height={60} />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="utilizationRate" fill="var(--color-utilizationRate)" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Select a chart type to view data
          </div>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Interactive Analytics</CardTitle>
        <CardDescription>
          {filters.unitIds.length > 0 
            ? `Showing data for selected unit(s)` 
            : 'Showing data for all units'
          } | Chart Type: {filters.chartType} | Period: {filters.period}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {renderChart()}
        
        {/* Data Summary */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {graphData.unitComparison.reduce((sum, unit) => sum + unit.totalHours, 0).toFixed(1)}
              </div>
              <p className="text-xs text-muted-foreground">Total Hours</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {graphData.unitComparison.reduce((sum, unit) => sum + unit.employeeCount, 0)}
              </div>
              <p className="text-xs text-muted-foreground">Total Employees</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {graphData.unitComparison.length > 0 
                  ? (graphData.unitComparison.reduce((sum, unit) => sum + unit.utilizationRate, 0) / graphData.unitComparison.length).toFixed(1)
                  : 0
                }%
              </div>
              <p className="text-xs text-muted-foreground">Avg Utilization</p>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
};
