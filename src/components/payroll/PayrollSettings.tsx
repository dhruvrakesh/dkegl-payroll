
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Settings } from 'lucide-react';

interface PayrollSetting {
  setting_id: string;
  effective_from: string;
  pf_rate: number;
  esi_rate: number;
  created_at: string;
}

export const PayrollSettings = () => {
  const [settings, setSettings] = useState<PayrollSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    effective_from: '',
    pf_rate: '',
    esi_rate: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('payroll_settings')
        .select('*')
        .order('effective_from', { ascending: false });

      if (error) throw error;
      setSettings(data || []);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: "Error",
        description: "Failed to fetch payroll settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const submitData = {
        effective_from: formData.effective_from,
        pf_rate: parseFloat(formData.pf_rate),
        esi_rate: parseFloat(formData.esi_rate)
      };

      const { error } = await supabase
        .from('payroll_settings')
        .insert([submitData]);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Payroll settings updated successfully",
      });
      
      setFormData({
        effective_from: '',
        pf_rate: '',
        esi_rate: ''
      });
      fetchSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save payroll settings",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div>Loading payroll settings...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Update Payroll Settings
          </CardTitle>
          <CardDescription>
            Configure PF and ESI rates. New rates will be effective from the specified date.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="effective_from">Effective From</Label>
                <Input
                  id="effective_from"
                  type="date"
                  value={formData.effective_from}
                  onChange={(e) => setFormData({ ...formData, effective_from: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="pf_rate">PF Rate (%)</Label>
                <Input
                  id="pf_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.pf_rate}
                  onChange={(e) => setFormData({ ...formData, pf_rate: e.target.value })}
                  placeholder="12.00"
                  required
                />
              </div>
              <div>
                <Label htmlFor="esi_rate">ESI Rate (%)</Label>
                <Input
                  id="esi_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.esi_rate}
                  onChange={(e) => setFormData({ ...formData, esi_rate: e.target.value })}
                  placeholder="3.25"
                  required
                />
              </div>
            </div>
            <Button type="submit">
              Update Settings
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Settings History</CardTitle>
          <CardDescription>
            Historical payroll settings with their effective dates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Effective From</TableHead>
                <TableHead>PF Rate (%)</TableHead>
                <TableHead>ESI Rate (%)</TableHead>
                <TableHead>Created At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {settings.map((setting) => (
                <TableRow key={setting.setting_id}>
                  <TableCell className="font-medium">
                    {new Date(setting.effective_from).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{setting.pf_rate}%</TableCell>
                  <TableCell>{setting.esi_rate}%</TableCell>
                  <TableCell>{new Date(setting.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
