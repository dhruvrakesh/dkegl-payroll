import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, FileText, CheckCircle, XCircle, Download } from 'lucide-react';
import Papa from 'papaparse';

interface UploadResult {
  successCount: number;
  errorCount: number;
  errors: Array<{
    rowNumber: number;
    data: any;
    reason: string;
    category: string;
  }>;
}

export const BulkEmailUploader = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const downloadTemplate = () => {
    const csvContent = `employee_code,email,is_primary
EMP-PAN-0001,john.doe@company.com,true
EMP-PAN-0002,jane.smith@company.com,true
EMP-KTK-0001,bob.wilson@company.com,true`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'employee_emails_template.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    toast({
      title: "Template Downloaded",
      description: "Employee emails template has been downloaded",
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a CSV file",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setUploadResult(null);

    try {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          try {
            console.log('Parsed CSV data:', results.data);

            // Validate required columns
            const requiredColumns = ['employee_code', 'email'];
            const headers = Object.keys(results.data[0] || {});
            const missingColumns = requiredColumns.filter(col => !headers.includes(col));

            if (missingColumns.length > 0) {
              throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
            }

            // Call the validation function
            const { data, error } = await supabase.rpc('validate_employee_emails_csv', {
              rows: results.data as any[]
            });

            if (error) throw error;

            const uploadResult = data as unknown as UploadResult;
            setUploadResult(uploadResult);

            toast({
              title: uploadResult.successCount > 0 ? "Upload Completed" : "Upload Failed", 
              description: `${uploadResult.successCount} emails uploaded successfully, ${uploadResult.errorCount} failed`,
              variant: uploadResult.errorCount > 0 ? "destructive" : "default",
            });

          } catch (error) {
            console.error('Error processing CSV:', error);
            toast({
              title: "Upload Failed",
              description: error instanceof Error ? error.message : "Failed to upload emails",
              variant: "destructive",
            });
          } finally {
            setUploading(false);
          }
        },
        error: (error) => {
          console.error('CSV parsing error:', error);
          toast({
            title: "File Parse Error",
            description: "Failed to parse CSV file. Please check the format.",
            variant: "destructive",
          });
          setUploading(false);
        }
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload Error",
        description: "Failed to upload file",
        variant: "destructive",
      });
      setUploading(false);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Bulk Email Upload
        </CardTitle>
        <CardDescription>
          Upload employee email addresses in bulk using CSV format
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Button
            onClick={downloadTemplate}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download Template
          </Button>
        </div>

        <div className="space-y-2">
          <Label htmlFor="csv-file">Upload CSV File</Label>
          <Input
            id="csv-file"
            type="file"
            accept=".csv"
            ref={fileInputRef}
            onChange={handleFileUpload}
            disabled={uploading}
          />
          <p className="text-sm text-muted-foreground">
            CSV should contain columns: employee_code, email, is_primary (optional)
          </p>
        </div>

        {uploading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
            Processing email upload...
          </div>
        )}

        {uploadResult && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">
                  {uploadResult.successCount} emails uploaded successfully
                </span>
              </div>
              {uploadResult.errorCount > 0 && (
                <div className="flex items-center gap-2 text-red-600">
                  <XCircle className="h-4 w-4" />
                  <span className="text-sm">
                    {uploadResult.errorCount} emails failed
                  </span>
                </div>
              )}
            </div>

            {uploadResult.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Upload Errors:</h4>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {uploadResult.errors.slice(0, 10).map((error, index) => (
                    <div key={index} className="text-xs p-2 bg-red-50 border border-red-200 rounded">
                      <span className="font-medium">Row {error.rowNumber}:</span> {error.reason}
                    </div>
                  ))}
                  {uploadResult.errors.length > 10 && (
                    <div className="text-xs text-muted-foreground">
                      ...and {uploadResult.errors.length - 10} more errors
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};