import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, Download, FileText, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';

interface AdjustmentRecord {
  employee_code: string;
  casual_adjustment: number;
  earned_adjustment: number;
  reason: string;
  month: number;
  year: number;
}

interface Props {
  onUploadSuccess?: () => void;
}

export const LeaveBalanceAdjustmentCsv = ({ onUploadSuccess }: Props) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<AdjustmentRecord[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [globalReason, setGlobalReason] = useState('');
  const { toast } = useToast();

  const downloadTemplate = () => {
    const template = [
      {
        employee_code: 'EMP-PKLA-0001',
        casual_adjustment: -2,
        earned_adjustment: -1,
        reason: 'June 2025 reconciliation',
        month: 6,
        year: 2025
      },
      {
        employee_code: 'EMP-PKLA-0002', 
        casual_adjustment: 0,
        earned_adjustment: -0.5,
        reason: 'June 2025 reconciliation',
        month: 6,
        year: 2025
      }
    ];

    const csv = Papa.unparse(template);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leave_adjustment_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseFile(selectedFile);
    }
  };

  const parseFile = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as AdjustmentRecord[];
        const validationErrors: string[] = [];

        // Validate each record
        data.forEach((record, index) => {
          if (!record.employee_code?.trim()) {
            validationErrors.push(`Row ${index + 1}: Employee code is required`);
          }
          if (isNaN(Number(record.casual_adjustment))) {
            validationErrors.push(`Row ${index + 1}: Invalid casual adjustment value`);
          }
          if (isNaN(Number(record.earned_adjustment))) {
            validationErrors.push(`Row ${index + 1}: Invalid earned adjustment value`);
          }
          if (!record.month || isNaN(Number(record.month)) || Number(record.month) < 1 || Number(record.month) > 12) {
            validationErrors.push(`Row ${index + 1}: Invalid month (must be 1-12)`);
          }
          if (!record.year || isNaN(Number(record.year))) {
            validationErrors.push(`Row ${index + 1}: Invalid year`);
          }
        });

        setErrors(validationErrors);
        setPreview(data);
      },
      error: (error) => {
        toast({
          title: "Error",
          description: `Failed to parse CSV: ${error.message}`,
          variant: "destructive",
        });
      }
    });
  };

  const handleUpload = async () => {
    if (!file || preview.length === 0) {
      toast({
        title: "Error",
        description: "Please select a valid CSV file",
        variant: "destructive",
      });
      return;
    }

    if (errors.length > 0) {
      toast({
        title: "Error",
        description: "Please fix validation errors before uploading",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Group adjustments by month/year for batch processing
      const adjustmentGroups = preview.reduce((groups, record) => {
        const key = `${record.month}-${record.year}`;
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push({
          employee_code: record.employee_code,
          casual_adjustment: Number(record.casual_adjustment),
          earned_adjustment: Number(record.earned_adjustment),
          reason: record.reason || globalReason
        });
        return groups;
      }, {} as Record<string, any[]>);

      let totalProcessed = 0;
      let totalErrors = 0;

      // Process each month/year group
      for (const [monthYear, adjustments] of Object.entries(adjustmentGroups)) {
        const [month, year] = monthYear.split('-').map(Number);
        
        // First, get employee IDs for the employee codes
        const employeeCodes = adjustments.map(adj => adj.employee_code);
        const { data: employees, error: empError } = await supabase
          .from('payroll_employees')
          .select('id, employee_code')
          .in('employee_code', employeeCodes);

        if (empError) throw empError;

        // Map employee codes to IDs
        const codeToIdMap = new Map(employees?.map(emp => [emp.employee_code, emp.id]) || []);

        // Prepare adjustments with employee IDs
        const adjustmentsWithIds = adjustments
          .map(adj => {
            const employeeId = codeToIdMap.get(adj.employee_code);
            if (!employeeId) return null;
            
            return {
              employee_id: employeeId,
              casual_adjustment: adj.casual_adjustment,
              earned_adjustment: adj.earned_adjustment,
              current_casual_balance: 0, // Will be fetched in the function
              current_earned_balance: 0  // Will be fetched in the function
            };
          })
          .filter(Boolean);

        // Apply adjustments for this month/year
        const result = await supabase.rpc('apply_leave_adjustments' as any, {
          p_adjustments: adjustmentsWithIds,
          p_reason: adjustments[0].reason || globalReason,
          p_month: month,
          p_year: year
        });

        if (result.error) throw result.error;

        totalProcessed += result.data?.successCount || 0;
        totalErrors += result.data?.errorCount || 0;
      }

      toast({
        title: "Success",
        description: `Processed ${totalProcessed} adjustments with ${totalErrors} errors`,
      });

      if (onUploadSuccess) {
        onUploadSuccess();
      }

      // Reset form
      setFile(null);
      setPreview([]);
      setErrors([]);
      setGlobalReason('');
      
    } catch (error) {
      console.error('Error uploading adjustments:', error);
      toast({
        title: "Error",
        description: "Failed to process leave adjustments",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Bulk Leave Balance Adjustments
        </CardTitle>
        <CardDescription>
          Upload CSV file to apply bulk leave balance adjustments
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={downloadTemplate} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Download Template
          </Button>
        </div>

        <div>
          <Label htmlFor="global-reason">Global Reason (optional)</Label>
          <Textarea
            id="global-reason"
            value={globalReason}
            onChange={(e) => setGlobalReason(e.target.value)}
            placeholder="This reason will be used for records without individual reasons"
            rows={2}
          />
        </div>

        <div>
          <Label htmlFor="csv-file">CSV File</Label>
          <Input
            id="csv-file"
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
          />
        </div>

        {errors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <div className="font-semibold">Validation Errors:</div>
                {errors.slice(0, 5).map((error, index) => (
                  <div key={index} className="text-sm">{error}</div>
                ))}
                {errors.length > 5 && (
                  <div className="text-sm">... and {errors.length - 5} more errors</div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {preview.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium">Preview:</span>
              <Badge variant="secondary">{preview.length} records</Badge>
            </div>
            <div className="border rounded-lg p-3 max-h-40 overflow-y-auto">
              <div className="text-xs text-muted-foreground mb-2">
                First 5 records:
              </div>
              {preview.slice(0, 5).map((record, index) => (
                <div key={index} className="text-xs border-b py-1">
                  {record.employee_code}: CL{record.casual_adjustment > 0 ? '+' : ''}{record.casual_adjustment}, 
                  EL{record.earned_adjustment > 0 ? '+' : ''}{record.earned_adjustment} 
                  ({record.month}/{record.year})
                </div>
              ))}
            </div>
          </div>
        )}

        <Button 
          onClick={handleUpload} 
          disabled={!file || preview.length === 0 || errors.length > 0 || uploading}
          className="w-full"
        >
          {uploading ? (
            'Processing...'
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Apply {preview.length} Adjustments
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};