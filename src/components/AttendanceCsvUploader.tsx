
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Download, AlertCircle, CheckCircle, FileText, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Papa from 'papaparse';

interface UploadResult {
  successCount: number;
  errorCount: number;
  errors: Array<{
    rowNumber: number;
    data: any;
    reason: string;
    category: string;
    originalCode?: string;
    resolvedCode?: string;
  }>;
}

interface AttendanceCsvUploaderProps {
  onUploadSuccess?: () => void;
}

export const AttendanceCsvUploader = ({ onUploadSuccess }: AttendanceCsvUploaderProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const { toast } = useToast();

  const handleTemplateDownload = async () => {
    try {
      setDownloadingTemplate(true);
      console.log('Downloading enhanced attendance template...');
      
      const { data, error } = await supabase.functions.invoke('get-attendance-template-enhanced');
      
      if (error) {
        console.error('Template download error:', error);
        throw error;
      }

      // Create blob and download
      const blob = new Blob([data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'attendance_template_enhanced.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Template Downloaded",
        description: "Enhanced attendance template with Sunday handling downloaded successfully.",
      });
    } catch (error: any) {
      console.error('Template download failed:', error);
      toast({
        title: "Download Failed",
        description: error.message || "Failed to download template",
        variant: "destructive",
      });
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        toast({
          title: "Invalid File",
          description: "Please select a CSV file",
          variant: "destructive",
        });
        return;
      }
      setFile(selectedFile);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No File Selected",
        description: "Please select a CSV file to upload",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      console.log('Processing CSV file for upload...');
      
      const csvText = await file.text();
      
      // Parse CSV using PapaParse
      const parseResult = Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.toLowerCase().replace(/\s+/g, '_'),
      });

      if (parseResult.errors.length > 0) {
        console.warn('CSV parsing warnings:', parseResult.errors);
      }

      // Filter out instruction rows (starting with #)
      const dataRows = parseResult.data.filter((row: any) => 
        !Object.values(row).some(value => 
          typeof value === 'string' && value.trim().startsWith('#')
        )
      );

      console.log(`Processed ${dataRows.length} data rows from CSV`);

      if (dataRows.length === 0) {
        throw new Error('No valid data rows found in CSV file');
      }

      // Call the enhanced CSV upload function
      const { data, error } = await supabase.rpc('insert_attendance_from_csv_enhanced', {
        rows: dataRows
      });

      if (error) {
        console.error('Upload RPC error:', error);
        throw error;
      }

      const result = data as UploadResult;
      setUploadResult(result);

      if (result.successCount > 0) {
        toast({
          title: "Upload Completed",
          description: `Successfully uploaded ${result.successCount} attendance records. ${result.errorCount} errors.`,
        });
        onUploadSuccess?.();
      } else {
        toast({
          title: "Upload Failed",
          description: `No records were uploaded. ${result.errorCount} errors found.`,
          variant: "destructive",
        });
      }

    } catch (error: any) {
      console.error('Upload failed:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "An error occurred during upload",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Enhanced Attendance CSV Upload
          </CardTitle>
          <CardDescription>
            Upload attendance data with enhanced Sunday and weekend handling
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Sunday Upload Enhancement:</strong> For Sundays, use hours_worked=0 with status=WEEKLY_OFF for rest days, 
              or hours_worked &gt; 0 for overtime work (all hours automatically become overtime).
            </AlertDescription>
          </Alert>

          <div className="flex gap-4">
            <Button
              onClick={handleTemplateDownload}
              disabled={downloadingTemplate}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {downloadingTemplate ? 'Downloading...' : 'Download Enhanced Template'}
            </Button>
          </div>

          <div className="space-y-2">
            <Input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={uploading}
            />
            {file && (
              <p className="text-sm text-muted-foreground">
                Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          <Button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            {uploading ? 'Uploading...' : 'Upload Attendance Data'}
          </Button>
        </CardContent>
      </Card>

      {uploadResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Upload Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">Success</p>
                  <p className="text-sm text-green-700">{uploadResult.successCount} records</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-900">Errors</p>
                  <p className="text-sm text-red-700">{uploadResult.errorCount} records</p>
                </div>
              </div>
            </div>

            {uploadResult.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-destructive">Error Details:</h4>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {uploadResult.errors.slice(0, 10).map((error, index) => (
                    <Alert key={index} variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        <strong>Row {error.rowNumber}:</strong> {error.reason}
                        {error.originalCode && (
                          <span className="block text-xs mt-1">
                            Code: {error.originalCode}
                            {error.resolvedCode && ` → ${error.resolvedCode}`}
                          </span>
                        )}
                      </AlertDescription>
                    </Alert>
                  ))}
                  {uploadResult.errors.length > 10 && (
                    <p className="text-sm text-muted-foreground">
                      ... and {uploadResult.errors.length - 10} more errors
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
