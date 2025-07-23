import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Upload, Download, History, AlertTriangle } from 'lucide-react';
import Papa from 'papaparse';

interface UploadResult {
  batch_id: string;
  success_count: number;
  error_count: number;
  errors: Array<{
    row_number: number;
    employee_code: string;
    error: string;
    data: any;
  }>;
}

interface UploadHistory {
  id: string;
  batch_id: string;
  upload_timestamp: string;
  file_name: string;
  total_records: number;
  successful_records: number;
  failed_records: number;
  upload_status: string;
  error_details: any;
}

export const OvertimeRatesManager = () => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [uploadHistory, setUploadHistory] = useState<UploadHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [changeReason, setChangeReason] = useState('');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!changeReason.trim()) {
      toast({
        title: "Change Reason Required",
        description: "Please provide a reason for the overtime rate changes.",
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
            const ratesData = results.data.map((row: any) => ({
              employee_code: row.employee_code?.trim(),
              overtime_rate_per_hour: parseFloat(row.overtime_rate_per_hour || '0'),
            }));

            const { data, error } = await supabase.rpc('bulk_upload_overtime_rates', {
              p_rates_data: ratesData,
              p_file_name: file.name,
              p_change_reason: changeReason,
            });

            if (error) throw error;

            const result = data as unknown as UploadResult;
            setUploadResult(result);
            
            toast({
              title: "Upload Complete",
              description: `${result.success_count} rates updated successfully${result.error_count > 0 ? `, ${result.error_count} errors` : ''}`,
              variant: result.error_count > 0 ? "destructive" : "default",
            });

            // Clear the file input and reason
            event.target.value = '';
            setChangeReason('');
            
            // Refresh history
            fetchUploadHistory();
          } catch (error) {
            console.error('Upload error:', error);
            toast({
              title: "Upload Failed",
              description: error instanceof Error ? error.message : "An error occurred during upload",
              variant: "destructive",
            });
          } finally {
            setUploading(false);
          }
        },
        error: (error) => {
          console.error('CSV parsing error:', error);
          toast({
            title: "File Parsing Error",
            description: "Failed to parse CSV file. Please check the format.",
            variant: "destructive",
          });
          setUploading(false);
        },
      });
    } catch (error) {
      console.error('File processing error:', error);
      toast({
        title: "Error",
        description: "Failed to process file",
        variant: "destructive",
      });
      setUploading(false);
    }
  };

  const fetchUploadHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('overtime_rates_upload_history')
        .select('*')
        .order('upload_timestamp', { ascending: false })
        .limit(20);

      if (error) throw error;
      setUploadHistory(data || []);
    } catch (error) {
      console.error('Error fetching upload history:', error);
      toast({
        title: "Error",
        description: "Failed to load upload history",
        variant: "destructive",
      });
    }
  };

  const downloadTemplate = () => {
    const template = [
      { employee_code: 'EMP-SATGURU-BADDI-0001', overtime_rate_per_hour: '50.00' },
      { employee_code: 'EMP-DKEGL-PKL-0001', overtime_rate_per_hour: '45.00' },
    ];

    const csv = Papa.unparse(template);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'overtime_rates_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  React.useEffect(() => {
    if (showHistory) {
      fetchUploadHistory();
    }
  }, [showHistory]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Bulk Upload Overtime Rates
          </CardTitle>
          <CardDescription>
            Upload employee-specific overtime rates (INR per hour) using CSV format
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="changeReason">Change Reason *</Label>
            <Textarea
              id="changeReason"
              placeholder="Enter reason for overtime rate changes..."
              value={changeReason}
              onChange={(e) => setChangeReason(e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="csvFile">CSV File</Label>
              <Input
                id="csvFile"
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                disabled={uploading}
                className="mt-1"
              />
            </div>
            <div className="flex flex-col justify-end">
              <Button
                variant="outline"
                onClick={downloadTemplate}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Template
              </Button>
            </div>
          </div>

          {uploading && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Processing upload...</p>
            </div>
          )}

          {uploadResult && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Upload Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-4">
                  <Badge variant="default">{uploadResult.success_count} Success</Badge>
                  {uploadResult.error_count > 0 && (
                    <Badge variant="destructive">{uploadResult.error_count} Errors</Badge>
                  )}
                </div>

                {uploadResult.errors.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Errors:
                    </h4>
                    <div className="max-h-40 overflow-y-auto">
                      {uploadResult.errors.map((error, index) => (
                        <div key={index} className="text-xs bg-destructive/10 p-2 rounded mb-1">
                          Row {error.row_number}: {error.employee_code} - {error.error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Upload History
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
            >
              {showHistory ? 'Hide' : 'Show'} History
            </Button>
          </CardTitle>
        </CardHeader>
        {showHistory && (
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>File Name</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Success</TableHead>
                  <TableHead>Errors</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {uploadHistory.map((upload) => (
                  <TableRow key={upload.id}>
                    <TableCell>
                      {new Date(upload.upload_timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>{upload.file_name || 'N/A'}</TableCell>
                    <TableCell>{upload.total_records}</TableCell>
                    <TableCell>{upload.successful_records}</TableCell>
                    <TableCell>{upload.failed_records}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          upload.upload_status === 'COMPLETED'
                            ? 'default'
                            : upload.upload_status === 'COMPLETED_WITH_ERRORS'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {upload.upload_status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        )}
      </Card>
    </div>
  );
};