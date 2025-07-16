import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';

interface EmployeeCodeStats {
  total_employees: number;
  employees_with_codes: number;
  employees_without_codes: number;
  units_with_employees: Array<{
    unit_name: string;
    unit_code: string;
    employee_count: number;
    codes_generated: number;
  }>;
}

export const EmployeeCodeStatus = () => {
  const [stats, setStats] = useState<EmployeeCodeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Get overall stats
      const { data: employees, error: empError } = await supabase
        .from('payroll_employees')
        .select(`
          id,
          employee_code,
          unit_id,
          units (
            unit_name,
            unit_code
          )
        `)
        .eq('active', true);

      if (empError) throw empError;

      const totalEmployees = employees?.length || 0;
      const employeesWithCodes = employees?.filter(emp => emp.employee_code).length || 0;
      const employeesWithoutCodes = totalEmployees - employeesWithCodes;

      // Group by units
      const unitStats = employees?.reduce((acc: any, emp) => {
        const unitKey = emp.units?.unit_code || 'NO_UNIT';
        const unitName = emp.units?.unit_name || 'No Unit Assigned';
        
        if (!acc[unitKey]) {
          acc[unitKey] = {
            unit_name: unitName,
            unit_code: unitKey,
            employee_count: 0,
            codes_generated: 0
          };
        }
        
        acc[unitKey].employee_count++;
        if (emp.employee_code) {
          acc[unitKey].codes_generated++;
        }
        
        return acc;
      }, {});

      setStats({
        total_employees: totalEmployees,
        employees_with_codes: employeesWithCodes,
        employees_without_codes: employeesWithoutCodes,
        units_with_employees: Object.values(unitStats || {})
      });

    } catch (error) {
      console.error('Error fetching employee code stats:', error);
      toast({
        title: "Error",
        description: "Failed to fetch employee code statistics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateMissingCodes = async () => {
    try {
      setGenerating(true);
      
      // Get employees without codes
      const { data: employeesWithoutCodes, error: fetchError } = await supabase
        .from('payroll_employees')
        .select('id, unit_id')
        .eq('active', true)
        .is('employee_code', null)
        .not('unit_id', 'is', null);

      if (fetchError) throw fetchError;

      if (!employeesWithoutCodes || employeesWithoutCodes.length === 0) {
        toast({
          title: "All Set!",
          description: "All employees already have employee codes",
        });
        return;
      }

      // Generate codes for each employee
      let generatedCount = 0;
      for (const emp of employeesWithoutCodes) {
        const { data: newCode, error: genError } = await supabase
          .rpc('generate_employee_code', { p_unit_id: emp.unit_id });

        if (genError) {
          console.error('Error generating code for employee:', emp.id, genError);
          continue;
        }

        const { error: updateError } = await supabase
          .from('payroll_employees')
          .update({ employee_code: newCode })
          .eq('id', emp.id);

        if (updateError) {
          console.error('Error updating employee code:', emp.id, updateError);
          continue;
        }

        generatedCount++;
      }

      toast({
        title: "Success",
        description: `Generated ${generatedCount} employee codes`,
      });

      // Refresh stats
      fetchStats();

    } catch (error) {
      console.error('Error generating employee codes:', error);
      toast({
        title: "Error",
        description: "Failed to generate employee codes",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  const completionPercentage = stats.total_employees > 0 
    ? Math.round((stats.employees_with_codes / stats.total_employees) * 100)
    : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Employee Code System Status
              {completionPercentage === 100 ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
              )}
            </CardTitle>
            <CardDescription>
              Automatic employee code generation for enhanced CSV operations
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchStats}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {stats.total_employees}
            </div>
            <div className="text-sm text-muted-foreground">Total Employees</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {stats.employees_with_codes}
            </div>
            <div className="text-sm text-muted-foreground">With Codes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {stats.employees_without_codes}
            </div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <Badge variant={completionPercentage === 100 ? "default" : "secondary"}>
            {completionPercentage}%
          </Badge>
        </div>

        {stats.employees_without_codes > 0 && (
          <Button 
            onClick={generateMissingCodes}
            disabled={generating}
            className="w-full"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Codes...
              </>
            ) : (
              <>
                Generate Missing Codes ({stats.employees_without_codes})
              </>
            )}
          </Button>
        )}

        {stats.units_with_employees.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Unit-wise Breakdown:</h4>
            {stats.units_with_employees.map((unit) => (
              <div 
                key={unit.unit_code} 
                className="flex items-center justify-between p-2 bg-gray-50 rounded"
              >
                <div>
                  <span className="font-medium">{unit.unit_name}</span>
                  <span className="text-sm text-muted-foreground ml-2">
                    ({unit.unit_code})
                  </span>
                </div>
                <Badge 
                  variant={unit.codes_generated === unit.employee_count ? "default" : "secondary"}
                >
                  {unit.codes_generated}/{unit.employee_count}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};