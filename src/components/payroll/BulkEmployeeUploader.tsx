import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle, X } from 'lucide-react';
import Papa from 'papaparse';
import { supabase } from '@/integrations/supabase/client';

interface UploadResult {
  successCount: number;
  errorCount: number;
  errors?: Array<{
    rowNumber: number;
    data: any;
    reason: string;
    category: string;
  }>;
}

interface BulkEmployeeUploaderProps {
  onUploadComplete: () => void;
}

export const BulkEmployeeUploader: React.FC<BulkEmployeeUploaderProps> = ({ onUploadComplete }) => {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const downloadTemplate = async () => {
    try {
      // Create CSV template data
      const templateData = [
        {
          name: 'John Doe',
          uan_number: '123456789012',
          unit_code: 'DKEPKL',
          department_code: 'HR',
          joining_date: '2024-01-15',
          date_of_birth: '1990-05-20',
          base_salary: '25000',
          hra_amount: '5000',
          other_conv_amount: '2000',
          pan_number: 'ABCDE1234F',
          aadhaar_number: '123456789012',
          email: 'john@company.com',
          preferred_language: 'english'
        }
      ];

      const csv = Papa.unparse(templateData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'employee_bulk_upload_template.csv';
      link.click();
      URL.revokeObjectURL(link.href);
      
      toast({
        title: "Template Downloaded",
        description: "Employee upload template has been downloaded successfully.",
      });
    } catch (error) {
      console.error('Error downloading template:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download template. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
      setUploadResult(null);
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a valid CSV file.",
        variant: "destructive",
      });
    }
  };

  const processUpload = async () => {
    if (!csvFile) return;

    setUploading(true);
    setProgress(0);

    try {
      // Parse CSV file
      Papa.parse(csvFile, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          setProgress(25);
          
          if (results.errors.length > 0) {
            console.error('CSV parsing errors:', results.errors);
            toast({
              title: "CSV Parse Error",
              description: "There were errors parsing the CSV file.",
              variant: "destructive",
            });
            setUploading(false);
            return;
          }

          setProgress(50);

          try {
            // Call the bulk create function
            const { data, error } = await supabase.rpc('bulk_create_employees_from_csv', {
              rows: results.data as any
            });

            setProgress(100);

            if (error) {
              console.error('Error uploading employees:', error);
              toast({
                title: "Upload Failed",
                description: error.message || "Failed to upload employees.",
                variant: "destructive",
              });
            } else {
              const result = data as unknown as UploadResult;
              setUploadResult(result);
              
              if (result.successCount > 0) {
                toast({
                  title: "Upload Successful",
                  description: `Successfully uploaded ${result.successCount} employees.`,
                });
                onUploadComplete();
              }
              
              if (result.errorCount > 0) {
                toast({
                  title: "Partial Upload",
                  description: `${result.errorCount} rows had errors. Check the results below.`,
                  variant: "destructive",
                });
              }
            }
          } catch (error) {
            console.error('Error calling bulk upload function:', error);
            toast({
              title: "Upload Failed",
              description: "An unexpected error occurred during upload.",
              variant: "destructive",
            });
          }

          setUploading(false);
        },
        error: (error) => {
          console.error('CSV parsing error:', error);
          toast({
            title: "File Parse Error",
            description: "Failed to parse the CSV file.",
            variant: "destructive",
          });
          setUploading(false);
        }
      });
    } catch (error) {
      console.error('Error processing upload:', error);
      toast({
        title: "Upload Error",
        description: "An error occurred while processing the upload.",
        variant: "destructive",
      });
      setUploading(false);
    }
  };

  const resetUpload = () => {
    setCsvFile(null);
    setUploadResult(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Bulk Employee Upload
          </CardTitle>
          <CardDescription>
            Upload multiple employees at once using a CSV file. Download the template first to ensure proper formatting.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Template Download */}
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Download Template</p>
                <p className="text-sm text-muted-foreground">
                  Get the CSV template with required columns and sample data
                </p>
              </div>
            </div>
            <Button onClick={downloadTemplate} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>

          {/* File Upload */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="csv-file">Select CSV File</Label>
              <input
                ref={fileInputRef}
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="mt-1 block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
            </div>

            {csvFile && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  File selected: {csvFile.name} ({(csvFile.size / 1024).toFixed(1)} KB)
                </AlertDescription>
              </Alert>
            )}

            {uploading && (
              <div className="space-y-2">
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-muted-foreground text-center">
                  Uploading employees... {progress}%
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                onClick={processUpload} 
                disabled={!csvFile || uploading}
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Uploading...' : 'Upload Employees'}
              </Button>
              
              {(csvFile || uploadResult) && (
                <Button onClick={resetUpload} variant="outline">
                  <X className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Results */}
      {uploadResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {uploadResult.errorCount === 0 ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-amber-600" />
              )}
              Upload Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Badge variant="outline" className="text-green-600 border-green-600">
                Success: {uploadResult.successCount}
              </Badge>
              {uploadResult.errorCount > 0 && (
                <Badge variant="outline" className="text-red-600 border-red-600">
                  Errors: {uploadResult.errorCount}
                </Badge>
              )}
            </div>

            {uploadResult.errors && uploadResult.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-destructive">Error Details:</h4>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {uploadResult.errors.map((error, index) => (
                    <Alert key={index} variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Row {error.rowNumber}:</strong> {error.reason}
                        {error.category && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            {error.category}
                          </Badge>
                        )}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div>
            <strong>Required Fields:</strong>
            <ul className="list-disc list-inside ml-4 mt-1">
              <li>name - Employee full name</li>
              <li>uan_number - Unique 12-digit UAN number</li>
              <li>unit_code - Valid unit code (e.g., DKEPKL, DKEVAD)</li>
              <li>joining_date - Date in YYYY-MM-DD format</li>
              <li>base_salary - Monthly basic salary amount</li>
            </ul>
          </div>
          
          <div>
            <strong>Optional Fields:</strong>
            <ul className="list-disc list-inside ml-4 mt-1">
              <li>department_code - Department code if applicable</li>
              <li>date_of_birth - Date in YYYY-MM-DD format</li>
              <li>hra_amount, other_conv_amount - Additional salary components</li>
              <li>pan_number - PAN in format ABCDE1234F</li>
              <li>aadhaar_number - 12-digit Aadhaar number</li>
              <li>email - Valid email address</li>
              <li>preferred_language - 'english' or 'hindi'</li>
            </ul>
          </div>

          <div>
            <strong>Notes:</strong>
            <ul className="list-disc list-inside ml-4 mt-1">
              <li>Employee codes will be auto-generated based on the unit</li>
              <li>UAN numbers must be unique across all employees</li>
              <li>All monetary amounts should be in INR without currency symbols</li>
              <li>The system will validate all data before inserting</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};