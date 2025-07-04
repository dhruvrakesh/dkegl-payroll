
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2 } from 'lucide-react';

interface Unit {
  unit_id: string;
  unit_name: string;
  location: string;
  created_at: string;
}

export const UnitsManagement = () => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [formData, setFormData] = useState({
    unit_name: '',
    location: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchUnits();
  }, []);

  const fetchUnits = async () => {
    try {
      const { data, error } = await supabase
        .from('units')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUnits(data || []);
    } catch (error) {
      console.error('Error fetching units:', error);
      toast({
        title: "Error",
        description: "Failed to fetch units",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingUnit) {
        const { error } = await supabase
          .from('units')
          .update(formData)
          .eq('unit_id', editingUnit.unit_id);
        
        if (error) throw error;
        toast({
          title: "Success",
          description: "Unit updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('units')
          .insert([formData]);
        
        if (error) throw error;
        toast({
          title: "Success",
          description: "Unit created successfully",
        });
      }
      
      setDialogOpen(false);
      setEditingUnit(null);
      setFormData({ unit_name: '', location: '' });
      fetchUnits();
    } catch (error) {
      console.error('Error saving unit:', error);
      toast({
        title: "Error",
        description: "Failed to save unit",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (unit: Unit) => {
    setEditingUnit(unit);
    setFormData({
      unit_name: unit.unit_name,
      location: unit.location || ''
    });
    setDialogOpen(true);
  };

  const handleDelete = async (unitId: string) => {
    if (!confirm('Are you sure you want to delete this unit?')) return;
    
    try {
      const { error } = await supabase
        .from('units')
        .delete()
        .eq('unit_id', unitId);
      
      if (error) throw error;
      toast({
        title: "Success",
        description: "Unit deleted successfully",
      });
      fetchUnits();
    } catch (error) {
      console.error('Error deleting unit:', error);
      toast({
        title: "Error",
        description: "Failed to delete unit",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div>Loading units...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Units</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingUnit(null);
              setFormData({ unit_name: '', location: '' });
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Unit
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingUnit ? 'Edit Unit' : 'Add New Unit'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="unit_name">Unit Name</Label>
                <Input
                  id="unit_name"
                  value={formData.unit_name}
                  onChange={(e) => setFormData({ ...formData, unit_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingUnit ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Unit Name</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {units.map((unit) => (
            <TableRow key={unit.unit_id}>
              <TableCell className="font-medium">{unit.unit_name}</TableCell>
              <TableCell>{unit.location || '-'}</TableCell>
              <TableCell>{new Date(unit.created_at).toLocaleDateString()}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(unit)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(unit.unit_id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
