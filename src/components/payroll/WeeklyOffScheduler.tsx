import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Save, RefreshCw, AlertTriangle } from 'lucide-react';
import { format, addDays, startOfWeek, endOfWeek } from 'date-fns';

interface WeeklyOffRule {
  id: string;
  unit_id: string;
  unit_name: string;
  day_of_week: number;
  effective_from: string;
  effective_to: string | null;
  is_active: boolean;
}

export const WeeklyOffScheduler = () => {
  const [rules, setRules] = useState<WeeklyOffRule[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [newRule, setNewRule] = useState({
    unit_id: '',
    day_of_week: 0,
    effective_from: format(new Date(), 'yyyy-MM-dd'),
    effective_to: ''
  });
  const { toast } = useToast();

  const daysOfWeek = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch units
      const { data: unitsData, error: unitsError } = await supabase
        .from('units')
        .select('*')
        .order('unit_name');

      if (unitsError) throw unitsError;
      setUnits(unitsData || []);

      // Fetch existing weekly off rules
      const { data: rulesData, error: rulesError } = await supabase
        .from('weekly_off_rules')
        .select(`
          *,
          units(unit_name)
        `)
        .order('effective_from', { ascending: false });

      if (rulesError) throw rulesError;
      setRules(rulesData?.map(rule => ({
        ...rule,
        unit_name: rule.units?.unit_name || 'Unknown Unit'
      })) || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch weekly off data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRule = async () => {
    if (!newRule.unit_id || !newRule.effective_from) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('weekly_off_rules')
        .insert([{
          unit_id: newRule.unit_id,
          day_of_week: newRule.day_of_week,
          effective_from: newRule.effective_from,
          effective_to: newRule.effective_to || null,
          is_active: true
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Weekly off rule created successfully",
      });

      setNewRule({
        unit_id: '',
        day_of_week: 0,
        effective_from: format(new Date(), 'yyyy-MM-dd'),
        effective_to: ''
      });

      fetchData();
    } catch (error) {
      console.error('Error saving rule:', error);
      toast({
        title: "Error",
        description: "Failed to save weekly off rule",
        variant: "destructive",
      });
    }
  };

  const toggleRuleStatus = async (ruleId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('weekly_off_rules')
        .update({ is_active: !currentStatus })
        .eq('id', ruleId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Rule ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
      });

      fetchData();
    } catch (error) {
      console.error('Error updating rule:', error);
      toast({
        title: "Error",
        description: "Failed to update rule status",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Calendar className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Weekly Off Scheduler</h2>
          <p className="text-muted-foreground">
            Manage weekly off days for different units and departments
          </p>
        </div>
      </div>

      {/* Add New Rule */}
      <Card>
        <CardHeader>
          <CardTitle>Create Weekly Off Rule</CardTitle>
          <CardDescription>
            Set up weekly off days for specific units with date ranges
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="unit">Unit *</Label>
              <Select value={newRule.unit_id} onValueChange={(value) => setNewRule(prev => ({ ...prev, unit_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {units.map(unit => (
                    <SelectItem key={unit.unit_id} value={unit.unit_id}>
                      {unit.unit_name} ({unit.unit_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="day">Weekly Off Day *</Label>
              <Select value={newRule.day_of_week.toString()} onValueChange={(value) => setNewRule(prev => ({ ...prev, day_of_week: parseInt(value) }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {daysOfWeek.map(day => (
                    <SelectItem key={day.value} value={day.value.toString()}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="effective_from">Effective From *</Label>
              <Input
                type="date"
                value={newRule.effective_from}
                onChange={(e) => setNewRule(prev => ({ ...prev, effective_from: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="effective_to">Effective To (Optional)</Label>
              <Input
                type="date"
                value={newRule.effective_to}
                onChange={(e) => setNewRule(prev => ({ ...prev, effective_to: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSaveRule} className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              Save Rule
            </Button>
            <Button variant="outline" onClick={fetchData} className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Existing Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Existing Weekly Off Rules</CardTitle>
          <CardDescription>
            Manage and monitor current weekly off configurations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : rules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No weekly off rules configured
            </div>
          ) : (
            <div className="space-y-4">
              {rules.map(rule => (
                <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{rule.unit_name}</span>
                      <Badge variant={rule.is_active ? "default" : "secondary"}>
                        {rule.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {daysOfWeek.find(d => d.value === rule.day_of_week)?.label} weekly off
                    </div>
                    <div className="text-sm text-muted-foreground">
                      From: {format(new Date(rule.effective_from), 'dd MMM yyyy')}
                      {rule.effective_to && ` | To: ${format(new Date(rule.effective_to), 'dd MMM yyyy')}`}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleRuleStatus(rule.id, rule.is_active)}
                  >
                    {rule.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
