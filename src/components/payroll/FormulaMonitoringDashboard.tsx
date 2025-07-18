
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Activity, AlertTriangle, CheckCircle, Clock, TrendingUp, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

interface FormulaMetrics {
  id: string;
  formula_name: string;
  execution_count: number;
  avg_execution_time: number;
  success_rate: number;
  last_executed: string;
  error_count: number;
  status: 'healthy' | 'warning' | 'error';
}

interface OvertimeValidation {
  date: string;
  employee_count: number;
  discrepancies: number;
  total_ot_hours: number;
  validation_status: 'passed' | 'warning' | 'failed';
}

export const FormulaMonitoringDashboard = () => {
  const [formulaMetrics, setFormulaMetrics] = useState<FormulaMetrics[]>([]);
  const [overtimeValidations, setOvertimeValidations] = useState<OvertimeValidation[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchMonitoringData();
  }, []);

  const fetchMonitoringData = async () => {
    setLoading(true);
    try {
      // Fetch formula performance metrics
      const { data: metricsData, error: metricsError } = await supabase
        .from('formula_performance_metrics')
        .select('*')
        .order('last_executed', { ascending: false });

      if (metricsError) throw metricsError;
      setFormulaMetrics(metricsData || []);

      // Fetch overtime validation results
      const { data: overtimeData, error: overtimeError } = await supabase
        .from('overtime_validation_log')
        .select('*')
        .order('date', { ascending: false })
        .limit(30);

      if (overtimeError) throw overtimeError;
      setOvertimeValidations(overtimeData || []);

    } catch (error) {
      console.error('Error fetching monitoring data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch monitoring data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const runFormulaValidation = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('validate-formula', {
        body: { type: 'full_validation' }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Formula validation completed successfully",
      });

      fetchMonitoringData();
    } catch (error) {
      console.error('Error running validation:', error);
      toast({
        title: "Error",
        description: "Failed to run formula validation",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': case 'passed': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Formula & OT Monitoring</h2>
            <p className="text-muted-foreground">
              Real-time monitoring of formula performance and overtime calculations
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={runFormulaValidation} className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Run Validation
          </Button>
          <Button variant="outline" onClick={fetchMonitoringData} className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Formula Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Formula Performance Metrics
          </CardTitle>
          <CardDescription>
            Real-time performance monitoring of payroll calculation formulas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading metrics...</div>
          ) : formulaMetrics.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No formula metrics available
            </div>
          ) : (
            <div className="grid gap-4">
              {formulaMetrics.map(metric => (
                <div key={metric.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(metric.status)}
                      <span className="font-medium">{metric.formula_name}</span>
                      <Badge className={getStatusColor(metric.status)}>
                        {metric.status.toUpperCase()}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Last executed: {format(new Date(metric.last_executed), 'dd MMM yyyy HH:mm')}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Executions</div>
                      <div className="font-medium">{metric.execution_count.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Avg Time</div>
                      <div className="font-medium">{metric.avg_execution_time.toFixed(2)}ms</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Success Rate</div>
                      <div className="font-medium">{metric.success_rate.toFixed(1)}%</div>
                      <Progress value={metric.success_rate} className="h-1 mt-1" />
                    </div>
                    <div>
                      <div className="text-muted-foreground">Errors</div>
                      <div className="font-medium text-red-600">{metric.error_count}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Overtime Validation Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Overtime Validation Results
          </CardTitle>
          <CardDescription>
            Daily validation results for overtime calculations and discrepancies
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading validation results...</div>
          ) : overtimeValidations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No validation results available
            </div>
          ) : (
            <div className="space-y-3">
              {overtimeValidations.map((validation, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge className={getStatusColor(validation.validation_status)}>
                      {validation.validation_status.toUpperCase()}
                    </Badge>
                    <span className="font-medium">
                      {format(new Date(validation.date), 'dd MMM yyyy')}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-6 text-sm">
                    <div>
                      <span className="text-muted-foreground">Employees: </span>
                      <span className="font-medium">{validation.employee_count}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">OT Hours: </span>
                      <span className="font-medium">{validation.total_ot_hours.toFixed(1)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Discrepancies: </span>
                      <span className={`font-medium ${validation.discrepancies > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {validation.discrepancies}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">
                  {formulaMetrics.filter(m => m.status === 'healthy').length}
                </div>
                <div className="text-sm text-muted-foreground">Healthy Formulas</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold">
                  {formulaMetrics.filter(m => m.status === 'warning').length}
                </div>
                <div className="text-sm text-muted-foreground">Formulas with Warnings</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <div>
                <div className="text-2xl font-bold">
                  {overtimeValidations.filter(v => v.discrepancies > 0).length}
                </div>
                <div className="text-sm text-muted-foreground">Days with OT Issues</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
