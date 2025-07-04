
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, TestTube, AlertTriangle, CheckCircle } from 'lucide-react';

interface PayrollFormula {
  id: string;
  name: string;
  description: string;
  formula_type: string;
  expression: string;
  active: boolean;
  effective_from: string;
  version: number;
}

interface FormulaVariable {
  id: string;
  name: string;
  display_name: string;
  variable_type: string;
  default_value: number;
  description: string;
  active: boolean;
}

interface ValidationResult {
  valid: boolean;
  test_result: number;
  warnings: string[];
  suggestions: string[];
}

export const FormulaManagement = () => {
  const [formulas, setFormulas] = useState<PayrollFormula[]>([]);
  const [variables, setVariables] = useState<FormulaVariable[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFormula, setEditingFormula] = useState<PayrollFormula | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    formula_type: 'gross_salary',
    expression: '',
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchFormulas();
    fetchVariables();
  }, []);

  const fetchFormulas = async () => {
    try {
      const { data, error } = await supabase
        .from('payroll_formulas')
        .select('*')
        .order('formula_type', { ascending: true });

      if (error) throw error;
      setFormulas(data || []);
    } catch (error) {
      console.error('Error fetching formulas:', error);
      toast({
        title: "Error",
        description: "Failed to fetch formulas",
        variant: "destructive",
      });
    }
  };

  const fetchVariables = async () => {
    try {
      const { data, error } = await supabase
        .from('formula_variables')
        .select('*')
        .eq('active', true)
        .order('variable_type', { ascending: true });

      if (error) throw error;
      setVariables(data || []);
    } catch (error) {
      console.error('Error fetching variables:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateFormula = async () => {
    if (!formData.expression) return;

    try {
      const { data, error } = await supabase.functions.invoke('validate-formula', {
        body: {
          expression: formData.expression,
          formula_type: formData.formula_type
        }
      });

      if (error) throw error;
      setValidation(data);
    } catch (error) {
      console.error('Validation error:', error);
      setValidation({
        valid: false,
        test_result: 0,
        warnings: ['Failed to validate formula'],
        suggestions: []
      });
    }
  };

  const saveFormula = async () => {
    if (!validation?.valid) {
      toast({
        title: "Validation Required",
        description: "Please validate the formula before saving",
        variant: "destructive",
      });
      return;
    }

    try {
      const formulaData = {
        ...formData,
        effective_from: new Date().toISOString().split('T')[0],
      };

      if (editingFormula) {
        // Deactivate old formula and create new version
        await supabase
          .from('payroll_formulas')
          .update({ active: false })
          .eq('id', editingFormula.id);

        await supabase
          .from('payroll_formulas')
          .insert([{ ...formulaData, version: editingFormula.version + 1 }]);
      } else {
        // Deactivate existing formula of same type
        await supabase
          .from('payroll_formulas')
          .update({ active: false })
          .eq('formula_type', formData.formula_type)
          .eq('active', true);

        await supabase
          .from('payroll_formulas')
          .insert([formulaData]);
      }

      toast({
        title: "Success",
        description: "Formula saved successfully",
      });

      setDialogOpen(false);
      resetForm();
      fetchFormulas();
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Error",
        description: "Failed to save formula",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      formula_type: 'gross_salary',
      expression: '',
    });
    setEditingFormula(null);
    setValidation(null);
  };

  const editFormula = (formula: PayrollFormula) => {
    setFormData({
      name: formula.name,
      description: formula.description,
      formula_type: formula.formula_type,
      expression: formula.expression,
    });
    setEditingFormula(formula);
    setDialogOpen(true);
  };

  const getFormulaTypeColor = (type: string) => {
    switch (type) {
      case 'gross_salary': return 'bg-green-100 text-green-800';
      case 'deductions': return 'bg-red-100 text-red-800';
      case 'net_salary': return 'bg-blue-100 text-blue-800';
      case 'allowances': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div>Loading formula management...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Formula Management</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Create Formula
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingFormula ? 'Edit Formula' : 'Create New Formula'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Formula Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Enhanced Gross Salary"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe what this formula calculates"
                  />
                </div>

                <div>
                  <Label htmlFor="formula_type">Formula Type</Label>
                  <Select value={formData.formula_type} onValueChange={(value) => setFormData({ ...formData, formula_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gross_salary">Gross Salary</SelectItem>
                      <SelectItem value="deductions">Deductions</SelectItem>
                      <SelectItem value="net_salary">Net Salary</SelectItem>
                      <SelectItem value="allowances">Allowances</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="expression">Formula Expression</Label>
                  <Textarea
                    id="expression"
                    value={formData.expression}
                    onChange={(e) => setFormData({ ...formData, expression: e.target.value })}
                    placeholder="e.g., (base_salary / working_days_per_month) * days_present + overtime_amount"
                    rows={4}
                  />
                </div>

                <div className="flex space-x-2">
                  <Button type="button" onClick={validateFormula} variant="outline">
                    <TestTube className="w-4 h-4 mr-2" />
                    Validate
                  </Button>
                  <Button type="button" onClick={saveFormula} disabled={!validation?.valid}>
                    Save Formula
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Available Variables</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {variables.map((variable) => (
                        <div key={variable.id} className="text-xs">
                          <Badge variant="outline" className="mr-2">
                            {variable.name}
                          </Badge>
                          <span className="text-gray-600">{variable.display_name}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {validation && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center">
                        {validation.valid ? (
                          <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 mr-2 text-red-600" />
                        )}
                        Validation Result
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div>
                          <strong>Test Result:</strong> ₹{validation.test_result.toLocaleString()}
                        </div>
                        
                        {validation.warnings.length > 0 && (
                          <div>
                            <strong className="text-orange-600">Warnings:</strong>
                            <ul className="list-disc list-inside text-orange-600">
                              {validation.warnings.map((warning, index) => (
                                <li key={index}>{warning}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {validation.suggestions.length > 0 && (
                          <div>
                            <strong className="text-blue-600">Suggestions:</strong>
                            <ul className="list-disc list-inside text-blue-600">
                              {validation.suggestions.map((suggestion, index) => (
                                <li key={index}>{suggestion}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Expression</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Version</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {formulas.map((formula) => (
            <TableRow key={formula.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{formula.name}</div>
                  <div className="text-sm text-gray-600">{formula.description}</div>
                </div>
              </TableCell>
              <TableCell>
                <Badge className={getFormulaTypeColor(formula.formula_type)}>
                  {formula.formula_type.replace('_', ' ')}
                </Badge>
              </TableCell>
              <TableCell>
                <code className="text-xs bg-gray-100 p-1 rounded max-w-xs block truncate">
                  {formula.expression}
                </code>
              </TableCell>
              <TableCell>
                <Badge variant={formula.active ? "default" : "secondary"}>
                  {formula.active ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
              <TableCell>v{formula.version}</TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => editFormula(formula)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
