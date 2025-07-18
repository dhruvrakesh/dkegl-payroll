
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Upload, Download, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Papa from 'papaparse';
import { updateAttendanceBulk, type BulkUpdateResult } from '@/utils/supabaseHelpers';

interface AttendanceBulkUpdaterProps {
  onUpdateSuccess?: () => void;
}

export const AttendanceBulkUpdater = ({ onUpdateSuccess }: AttendanceBulkUpdaterProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [updateReason, setUpdateReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BulkUpdateResult | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      parsePreview(selectedFile);
    }
  };

  const parsePreview = (file: File) => {
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        const data = results.data as any[];
        setPreviewData(data.slice(0, 5)); // Show first 5 rows for preview
        setShowPreview(true);
      },
      error: (error) => {
        toast({
          title: "Error parsing CSV",
          description: error.message,
          variant: "destructive",
        });
      }
    });
  };

  const downloadTemplate = () => {
    const template = `employee_code,date,hours_worked,overtime_hours
EMP-001,2024-01-15,8,0
EMP-002,2024-01-15,9,1
EMP-003,2024-01-15,7,0`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'attendance_bulk_update_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Template downloaded",
      description: "Fill in the template with updated attendance data",
    });
  };

  const handleBulkUpdate = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a CSV file to upload",
        variant: "destructive",
      });
      return;
    }

    if (!updateReason.trim()) {
      toast({
        title: "Update reason required",
        description: "Please provide a reason for the bulk update",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      Papa.parse(file, {
        header: true,
        complete: async (results) => {
          try {
            const { data: result, error } = await updateAttendanceBulk(results.data as any[], updateReason);

            if (error) {
              throw error;
            }

            if (!result) {
              throw new Error('No result returned from bulk update');
            }

            setResult(result);
            
            if (result.successCount > 0) {
              toast({
                title: "Bulk update completed",
                description: `Updated ${result.successCount} attendance records successfully`,
              });
              onUpdateSuccess?.();
            }
            
            if (result.errorCount > 0) {
              toast({
                title: "Some updates failed",
                description: `${result.errorCount} records had errors. Check the report below.`,
                variant: "destructive",
              });
            }
          } catch (error) {
            console.error('Error updating attendance:', error);
            toast({
              title: "Update failed",
              description: error instanceof Error ? error.message : "There was an error updating the attendance records",
              variant: "destructive",
            });
          } finally {
            setLoading(false);
          }
        },
        error: (error) => {
          console.error('Error parsing CSV:', error);
          toast({
            title: "Error parsing CSV",
            description: error.message,
            variant: "destructive",
          });
          setLoading(false);
        }
      });
    } catch (error) {
      console.error('Error in bulk update:', error);
      toast({
        title: "Update failed",
        description: "There was an error processing the bulk update",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'validation': return 'bg-yellow-100 text-yellow-800';
      case 'missing_data': return 'bg-red-100 text-red-800';
      case 'not_found': return 'bg-blue-100 text-blue-800';
      case 'database_error': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const resetForm = () => {
    setFile(null);
    setUpdateReason('');
    setResult(null);
    setPreviewData([]);
    setShowPreview(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Bulk Update Attendance
        </CardTitle>
        <CardDescription>
          Update existing attendance records in bulk. Only existing records will be modified.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Important:</strong> This will only update existing attendance records. 
            To add new records, use the regular "Bulk Upload" tab. All updates require a reason for audit purposes.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div>
            <Label htmlFor="update-reason">Update Reason *</Label>
            <Textarea
              id="update-reason"
              placeholder="Explain why these attendance records need to be updated..."
              value={updateReason}
              onChange={(e) => setUpdateReason(e.target.value)}
              className="mt-1"
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={downloadTemplate}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download Template
            </Button>
          </div>

          <div>
            <Label htmlFor="csv-file">Select CSV File</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="mt-1"
            />
          </div>

          {showPreview && previewData.length > 0 && (
            <div className="space-y-2">
              <Label>Preview (First 5 rows)</Label>
              <div className="border rounded p-3 bg-muted/50 max-h-40 overflow-auto">
                <div className="text-sm space-y-1">
                  {previewData.map((row, index) => (
                    <div key={index} className="font-mono text-xs">
                      {JSON.stringify(row, null, 2)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleBulkUpdate}
              disabled={!file || !updateReason.trim() || loading}
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              {loading ? 'Updating...' : 'Update Attendance Records'}
            </Button>
            
            {(file || result) && (
              <Button variant="outline" onClick={resetForm}>
                Reset
              </Button>
            )}
          </div>
        </div>

        {result && (
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium">
                  {result.successCount} records updated successfully
                </span>
              </div>
              {result.errorCount > 0 && (
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="text-sm font-medium">
                    {result.errorCount} records failed
                  </span>
                </div>
              )}
            </div>

            {result.batchId && (
              <div className="text-sm text-muted-foreground">
                Batch ID: <code className="font-mono">{result.batchId}</code>
              </div>
            )}

            {result.errors && result.errors.length > 0 && (
              <div className="space-y-2">
                <Label>Error Details</Label>
                <div className="space-y-2 max-h-60 overflow-auto">
                  {result.errors.map((error, index) => (
                    <div key={index} className="border rounded p-3 text-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getCategoryColor(error.category)}>
                          Row {error.rowNumber}
                        </Badge>
                        <Badge variant="outline">
                          {error.category}
                        </Badge>
                      </div>
                      <p className="text-red-600 mb-2">{error.reason}</p>
                      <details className="text-xs text-muted-foreground">
                        <summary className="cursor-pointer">Data</summary>
                        <pre className="mt-1 p-2 bg-muted rounded font-mono">
                          {JSON.stringify(error.data, null, 2)}
                        </pre>
                      </details>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
