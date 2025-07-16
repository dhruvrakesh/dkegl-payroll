
import React, { useState } from 'react';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, Download, Loader2, CheckCircle, XCircle, ChevronDown, AlertTriangle } from 'lucide-react';

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

interface UploadError {
  rowNumber: number;
  data: any;
  reason: string;
  category: 'validation' | 'duplicate' | 'missing_data' | 'database_error';
}

interface UploadResult {
  successCount: number;
  errorCount: number;
  errors: UploadError[];
}

interface AttendanceCsvUploaderProps {
  onUploadSuccess?: () => void;
}

const REQUIRED_COLUMNS = ['employee_code', 'date', 'hours_worked', 'overtime_hours', 'unit_code'];

export const AttendanceCsvUploader = ({ onUploadSuccess }: AttendanceCsvUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [expandedErrors, setExpandedErrors] = useState(false);
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

            // Call the enhanced RPC function to get detailed response
            const { data: result, error: rpcError } = await (supabase.rpc as any)('insert_attendance_from_csv_enhanced', {
              rows: results.data as any
            });

            if (rpcError) {
              throw rpcError;
            }

            // Handle the detailed response - cast to expected type
            const backendResult = result as any;
            const uploadResult: UploadResult = {
              successCount: backendResult?.successCount || 0,
              errorCount: backendResult?.errorCount || 0,
              errors: (backendResult?.errors || []) as UploadError[]
            };

            setUploadResult(uploadResult);
            setShowResultDialog(true);

            // Show appropriate toast based on results
            if (uploadResult.errorCount === 0) {
              toast({
                title: "Complete Success",
                description: `Successfully imported all ${uploadResult.successCount} attendance records`,
              });
            } else if (uploadResult.successCount > 0) {
              toast({
                title: "Partial Success",
                description: `${uploadResult.successCount} records imported, ${uploadResult.errorCount} failed`,
                variant: "default"
              });
            } else {
              toast({
                title: "Upload Failed",
                description: `All ${uploadResult.errorCount} records failed to import`,
                variant: "destructive"
              });
            }

            // Clear the file input
            event.target.value = '';
            
            // Call the success callback to refresh data if any records were successful
            if (onUploadSuccess && uploadResult.successCount > 0) {
              onUploadSuccess();
            }
            
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
    // Create a link to the enhanced edge function endpoint
    const link = document.createElement('a');
    link.href = 'https://xltzaggnwhqskxkrzdqo.supabase.co/functions/v1/get-attendance-template-enhanced';
    link.download = 'attendance_template_enhanced.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'validation':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'duplicate':
        return <XCircle className="w-4 h-4 text-orange-500" />;
      case 'missing_data':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'database_error':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <XCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'validation':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'duplicate':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'missing_data':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'database_error':
        return 'bg-red-100 text-red-900 border-red-400';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <>
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
              Download Enhanced Template
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

          <div className="text-sm text-muted-foreground space-y-3">
            <div>
              <p className="font-medium mb-1">✨ Enhanced CSV Upload with Employee Codes:</p>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Use Employee Codes</strong> (EMP-PAN-0001) for 100% accuracy</li>
                <li>UAN numbers still supported but avoid Excel scientific notation</li>
                <li>Download employee master to get correct codes for your unit</li>
                <li>Template includes real employee codes from your system</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-1">CSV Format Requirements:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Required columns: employee_code, date, hours_worked, overtime_hours, unit_code</li>
                <li>Hours worked: 0-24 hours</li>
                <li>Overtime hours: 0 or positive numbers</li>
                <li>Date format: YYYY-MM-DD or DD-MM-YYYY</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Results Dialog */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {uploadResult?.errorCount === 0 ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : uploadResult?.successCount && uploadResult.successCount > 0 ? (
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              Upload Results
            </DialogTitle>
            <DialogDescription>
              {uploadResult && (
                <div className="flex gap-4 mt-2">
                  <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {uploadResult.successCount} Successful
                  </Badge>
                  {uploadResult.errorCount > 0 && (
                    <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-300">
                      <XCircle className="w-3 h-3 mr-1" />
                      {uploadResult.errorCount} Failed
                    </Badge>
                  )}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          {uploadResult && (
            <div className="space-y-4">
              {/* Success Summary */}
              {uploadResult.successCount > 0 && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="w-4 h-4" />
                    <span className="font-medium">
                      Successfully imported {uploadResult.successCount} attendance records
                    </span>
                  </div>
                </div>
              )}

              {/* Error Details */}
              {uploadResult.errorCount > 0 && (
                <div className="space-y-3">
                  <Collapsible open={expandedErrors} onOpenChange={setExpandedErrors}>
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        <span className="flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-red-500" />
                          View {uploadResult.errorCount} Failed Records
                        </span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${expandedErrors ? 'rotate-180' : ''}`} />
                      </Button>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent className="mt-3">
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-gray-50">
                              <TableHead className="w-16">Row</TableHead>
                              <TableHead className="w-32">Category</TableHead>
                              <TableHead>Error Reason</TableHead>
                              <TableHead>Employee Code</TableHead>
                              <TableHead>Date</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {uploadResult.errors.map((error, index) => (
                              <TableRow key={index} className="hover:bg-gray-50">
                                <TableCell className="font-mono text-sm">
                                  {error.rowNumber}
                                </TableCell>
                                <TableCell>
                                  <Badge 
                                    variant="outline" 
                                    className={`${getCategoryColor(error.category)} text-xs`}
                                  >
                                    {getCategoryIcon(error.category)}
                                    <span className="ml-1 capitalize">
                                      {error.category.replace('_', ' ')}
                                    </span>
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm">
                                  {error.reason}
                                </TableCell>
                                <TableCell className="font-mono text-sm">
                                  {error.data?.employee_code || 'N/A'}
                                </TableCell>
                                <TableCell className="font-mono text-sm">
                                  {error.data?.date || 'N/A'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setShowResultDialog(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
