
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Search } from 'lucide-react';

interface Unit {
  unit_id: string;
  unit_name: string;
  unit_code: string;
  location: string;
  created_at: string;
}

export const UnitsManagement = () => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    unit_name: '',
    unit_code: '',
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

  const generateUnitCode = (unitName: string, location: string) => {
    const nameCode = unitName.toUpperCase().replace(/[^A-Z]/g, '').substring(0, 3);
    const locationCode = location.toUpperCase().replace(/[^A-Z]/g, '').substring(0, 3);
    return `${nameCode}${locationCode}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.unit_name.trim()) {
      toast({
        title: "Error",
        description: "Unit name is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.unit_code.trim()) {
      toast({
        title: "Error",
        description: "Unit code is required",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check for duplicate unit codes (except when editing the same unit)
      const { data: existingUnit, error: checkError } = await supabase
        .from('units')
        .select('unit_id')
        .eq('unit_code', formData.unit_code.trim())
        .neq('unit_id', editingUnit?.unit_id || '');

      if (checkError) throw checkError;

      if (existingUnit && existingUnit.length > 0) {
        toast({
          title: "Error",
          description: "Unit code already exists. Please use a different code.",
          variant: "destructive",
        });
        return;
      }

      const submitData = {
        unit_name: formData.unit_name.trim(),
        unit_code: formData.unit_code.trim().toUpperCase(),
        location: formData.location.trim() || null
      };

      if (editingUnit) {
        const { error } = await supabase
          .from('units')
          .update(submitData)
          .eq('unit_id', editingUnit.unit_id);
        
        if (error) throw error;
        toast({
          title: "Success",
          description: "Unit updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('units')
          .insert([submitData]);
        
        if (error) throw error;
        toast({
          title: "Success",
          description: "Unit created successfully",
        });
      }
      
      setDialogOpen(false);
      setEditingUnit(null);
      setFormData({ unit_name: '', unit_code: '', location: '' });
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
      unit_code: unit.unit_code,
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

  const handleUnitNameChange = (name: string) => {
    setFormData(prev => ({ ...prev, unit_name: name }));
    
    // Auto-generate unit code if not editing an existing unit
    if (!editingUnit && name && formData.location) {
      const suggestedCode = generateUnitCode(name, formData.location);
      setFormData(prev => ({ ...prev, unit_code: suggestedCode }));
    }
  };

  const handleLocationChange = (location: string) => {
    setFormData(prev => ({ ...prev, location }));
    
    // Auto-generate unit code if not editing an existing unit
    if (!editingUnit && formData.unit_name && location) {
      const suggestedCode = generateUnitCode(formData.unit_name, location);
      setFormData(prev => ({ ...prev, unit_code: suggestedCode }));
    }
  };

  const filteredUnits = units.filter(unit => {
    const searchLower = searchTerm.toLowerCase();
    return (
      unit.unit_name.toLowerCase().includes(searchLower) ||
      unit.unit_code.toLowerCase().includes(searchLower) ||
      (unit.location && unit.location.toLowerCase().includes(searchLower))
    );
  });

  if (loading) {
    return <div>Loading units...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-4">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search units by name, code, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingUnit(null);
              setFormData({ unit_name: '', unit_code: '', location: '' });
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
                <Label htmlFor="unit_name">Unit Name *</Label>
                <Input
                  id="unit_name"
                  value={formData.unit_name}
                  onChange={(e) => handleUnitNameChange(e.target.value)}
                  placeholder="e.g., DKEGL - PKL"
                  required
                />
              </div>
              <div>
                <Label htmlFor="unit_code">Unit Code *</Label>
                <Input
                  id="unit_code"
                  value={formData.unit_code}
                  onChange={(e) => setFormData({ ...formData, unit_code: e.target.value.toUpperCase() })}
                  placeholder="e.g., DKEPKL"
                  required
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Unique identifier for the unit (auto-generated from name and location)
                </p>
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleLocationChange(e.target.value)}
                  placeholder="e.g., Panchkula"
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

      <div className="text-sm text-muted-foreground">
        Showing {filteredUnits.length} of {units.length} units
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Unit Code</TableHead>
            <TableHead>Unit Name</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredUnits.map((unit) => (
            <TableRow key={unit.unit_id}>
              <TableCell className="font-mono font-medium">{unit.unit_code}</TableCell>
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
