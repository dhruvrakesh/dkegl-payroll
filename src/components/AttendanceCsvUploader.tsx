
import React, { useState } from 'react';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, Download, Loader2 } from 'lucide-react';

interface CsvRow {
  employee_code: string;
  date: string;
  hours_worked: string;
  overtime_hours: string;
  unit_code: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

const REQUIRED_COLUMNS = ['employee_code', 'date', 'hours_worked', 'overtime_hours', 'unit_code'];

export const AttendanceCsvUploader = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const validateRequiredColumns = (data: any[]): string[] => {
    const errors: string[] = [];
    
    if (data.length === 0) {
      errors.push('CSV file is empty');
      return errors;
    }

    const firstRow = data[0];
    const missingColumns = REQUIRED_COLUMNS.filter(col => !(col in firstRow));
    if (missingColumns.length > 0) {
      errors.push(`Missing required columns: ${missingColumns.join(', ')}`);
    }

    return errors;
  };

  const validateDate = (dateStr: string, rowNum: number): string[] => {
    const errors: string[] = [];
    
    if (!dateStr?.trim()) {
      errors.push(`Row ${rowNum}: Date is required`);
    } else {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        errors.push(`Row ${rowNum}: Invalid date format`);
      }
    }

    return errors;
  };

  const validateHours = (hoursWorked: string, overtimeHours: string, rowNum: number): string[] => {
    const errors: string[] = [];
    
    const hours = parseFloat(hoursWorked || '0');
    if (isNaN(hours) || hours < 0 || hours > 24) {
      errors.push(`Row ${rowNum}: Hours worked must be between 0 and 24`);
    }

    const overtime = parseFloat(overtimeHours || '0');
    if (isNaN(overtime) || overtime < 0) {
      errors.push(`Row ${rowNum}: Overtime hours cannot be negative`);
    }

    return errors;
  };

  const validateRowData = (row: any, index: number): string[] => {
    const errors: string[] = [];
    const rowNum = index + 1;
    
    // Check required fields
    if (!row.employee_code?.trim()) {
      errors.push(`Row ${rowNum}: Employee code is required`);
    }
    
    // Validate date
    errors.push(...validateDate(row.date, rowNum));
    
    // Validate hours
    errors.push(...validateHours(row.hours_worked, row.overtime_hours, rowNum));

    return errors;
  };

  const validateCsvData = (data: any[]): ValidationResult => {
    const errors: string[] = [];
    
    // Check required columns
    errors.push(...validateRequiredColumns(data));
    
    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    // Validate each row
    data.forEach((row, index) => {
      errors.push(...validateRowData(row, index));
    });

    return { isValid: errors.length === 0, errors };
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsUploading(true);

    try {
      // Parse CSV file
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          try {
            // Validate data
            const { isValid, errors } = validateCsvData(results.data);
            
            if (!isValid) {
              setError(errors.join('\n'));
              setIsUploading(false);
              return;
            }

            // Call the RPC function using type assertion
            const { error: rpcError } = await (supabase.rpc as any)('insert_attendance_from_csv', {
              rows: results.data
            });

            if (rpcError) {
              throw rpcError;
            }

            toast({
              title: "Success",
              description: `Successfully imported ${results.data.length} attendance records`,
            });

            // Clear the file input
            event.target.value = '';
            
          } catch (error) {
            console.error('Upload error:', error);
            setError(error instanceof Error ? error.message : 'An error occurred during upload');
          } finally {
            setIsUploading(false);
          }
        },
        error: (error) => {
          setError(`CSV parsing error: ${error.message}`);
          setIsUploading(false);
        }
      });
    } catch (error) {
      console.error('File processing error:', error);
      setError('Failed to process the CSV file');
      setIsUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    // Create a link to the edge function endpoint using the direct URL
    const link = document.createElement('a');
    link.href = 'https://xltzaggnwhqskxkrzdqo.supabase.co/functions/v1/get-attendance-template';
    link.download = 'attendance_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Bulk CSV Upload</CardTitle>
        <CardDescription>
          Upload attendance records in bulk using a CSV file
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          <Button 
            variant="outline" 
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download Template
          </Button>
        </div>

        <div className="space-y-2">
          <Label htmlFor="csv-file">Upload CSV File</Label>
          <Input
            id="csv-file"
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            disabled={isUploading}
            className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/80"
          />
        </div>

        {error && (
          <div className="text-red-500 text-sm whitespace-pre-line bg-red-50 p-3 rounded-md border border-red-200">
            {error}
          </div>
        )}

        <Button 
          disabled={isUploading}
          variant="secondary"
          className="w-full"
          onClick={() => document.getElementById('csv-file')?.click()}
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Select CSV File
            </>
          )}
        </Button>

        <div className="text-sm text-muted-foreground">
          <p className="font-medium mb-1">CSV Format Requirements:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Required columns: employee_code, date, hours_worked, overtime_hours, unit_code</li>
            <li>Hours worked: 0-24 hours</li>
            <li>Overtime hours: 0 or positive numbers</li>
            <li>Date format: YYYY-MM-DD</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
