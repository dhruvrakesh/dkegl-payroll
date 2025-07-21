
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { UserPlus, Shield, Users, Activity, Settings, Database, UserCheck, UserX, Eye, Edit, UserMinus, RotateCcw } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  employee_id: string;
  role: 'admin' | 'hr' | 'manager' | 'employee';
  is_approved: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AuditLog {
  id: string;
  admin_id: string;
  action: string;
  target_table: string;
  target_id: string;
  created_at: string;
}

export function AdminDashboard() {
  const { user, profile, isAdmin } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch users
  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Type-safe mapping of user data
      const typedUsers: UserProfile[] = (data || []).map(user => ({
        id: user.id,
        email: user.email,
        employee_id: user.employee_id,
        role: user.role as 'admin' | 'hr' | 'manager' | 'employee',
        is_approved: user.is_approved,
        is_active: user.is_active ?? true, // Default to true if not set
        created_at: user.created_at,
        updated_at: user.updated_at
      }));
      
      setUsers(typedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    }
  };

  // Fetch audit logs
  const fetchAuditLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setAuditLogs(data || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    }
  };

  // Update user approval status
  const updateUserApproval = async (userId: string, approved: boolean) => {
    try {
      const { error } = await supabase.rpc('update_user_approval', {
        user_id: userId,
        approved: approved
      });

      if (error) throw error;

      // Log the action
      await supabase.from('admin_audit_log').insert({
        admin_id: user?.id,
        action: approved ? 'USER_APPROVED' : 'USER_REJECTED',
        target_table: 'profiles',
        target_id: userId,
        new_data: { is_approved: approved }
      });

      toast({
        title: "Success",
        description: `User ${approved ? 'approved' : 'rejected'} successfully`,
      });

      fetchUsers();
      fetchAuditLogs();
    } catch (error) {
      console.error('Error updating user approval:', error);
      toast({
        title: "Error",
        description: "Failed to update user approval",
        variant: "destructive",
      });
    }
  };

  // Update user role
  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;

      // Log the action
      await supabase.from('admin_audit_log').insert({
        admin_id: user?.id,
        action: 'USER_ROLE_UPDATED',
        target_table: 'profiles',
        target_id: userId,
        new_data: { role: newRole }
      });

      toast({
        title: "Success",
        description: `User role updated to ${newRole}`,
      });

      fetchUsers();
      fetchAuditLogs();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    }
  };

  // Deactivate user (soft delete)
  const deactivateUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_active: false, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', userId);

      if (error) throw error;

      // Log the action
      await supabase.from('admin_audit_log').insert({
        admin_id: user?.id,
        action: 'USER_DEACTIVATED',
        target_table: 'profiles',
        target_id: userId,
        new_data: { is_active: false }
      });

      toast({
        title: "Success",
        description: "User deactivated successfully",
      });

      fetchUsers();
      fetchAuditLogs();
    } catch (error) {
      console.error('Error deactivating user:', error);
      toast({
        title: "Error",
        description: "Failed to deactivate user",
        variant: "destructive",
      });
    }
  };

  // Reactivate user
  const reactivateUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_active: true, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', userId);

      if (error) throw error;

      // Log the action
      await supabase.from('admin_audit_log').insert({
        admin_id: user?.id,
        action: 'USER_REACTIVATED',
        target_table: 'profiles',
        target_id: userId,
        new_data: { is_active: true }
      });

      toast({
        title: "Success",
        description: "User reactivated successfully",
      });

      fetchUsers();
      fetchAuditLogs();
    } catch (error) {
      console.error('Error reactivating user:', error);
      toast({
        title: "Error",
        description: "Failed to reactivate user",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (isAdmin()) {
      fetchUsers();
      fetchAuditLogs();
    }
    setLoading(false);
  }, [isAdmin]);

  if (!isAdmin()) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Access Denied</CardTitle>
            <CardDescription className="text-center">
              You don't have admin privileges to access this dashboard.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.employee_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'approved' && user.is_approved) ||
                         (statusFilter === 'pending' && !user.is_approved) ||
                         (statusFilter === 'active' && user.is_active) ||
                         (statusFilter === 'inactive' && !user.is_active);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'hr': return 'default';
      case 'manager': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage users and system settings</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="destructive">
            <Shield className="w-4 h-4 mr-1" />
            Admin
          </Badge>
          <span className="text-sm text-muted-foreground">
            {profile?.email}
          </span>
        </div>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users">
            <Users className="w-4 h-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="audit">
            <Activity className="w-4 h-4 mr-2" />
            Audit Logs
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="system">
            <Database className="w-4 h-4 mr-2" />
            System
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage user accounts, roles, and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <Label htmlFor="search">Search Users</Label>
                  <Input
                    id="search"
                    placeholder="Search by email or employee ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="w-full sm:w-48">
                  <Label>Role Filter</Label>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="hr">HR</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="employee">Employee</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full sm:w-48">
                  <Label>Status Filter</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Employee ID</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Approval</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id} className={!user.is_active ? 'opacity-50' : ''}>
                        <TableCell className="font-medium">{user.email}</TableCell>
                        <TableCell>{user.employee_id}</TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(user.role)}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.is_approved ? 'default' : 'secondary'}>
                            {user.is_approved ? 'Approved' : 'Pending'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.is_active ? 'default' : 'destructive'}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {!user.is_approved && user.is_active && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateUserApproval(user.id, true)}
                              >
                                <UserCheck className="w-4 h-4" />
                              </Button>
                            )}
                            {user.is_approved && user.email !== 'info@dkenterprises.co.in' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateUserApproval(user.id, false)}
                              >
                                <UserX className="w-4 h-4" />
                              </Button>
                            )}
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline">
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Edit User Role</DialogTitle>
                                  <DialogDescription>
                                    Change the role for {user.email}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label>Role</Label>
                                    <Select
                                      defaultValue={user.role}
                                      onValueChange={(value) => updateUserRole(user.id, value)}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="admin">Admin</SelectItem>
                                        <SelectItem value="hr">HR</SelectItem>
                                        <SelectItem value="manager">Manager</SelectItem>
                                        <SelectItem value="employee">Employee</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                            {user.email !== 'info@dkenterprises.co.in' && (
                              <>
                                {user.is_active ? (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button size="sm" variant="destructive">
                                        <UserMinus className="w-4 h-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Deactivate User</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to deactivate {user.email}? They will no longer be able to access the system, but their data will be preserved.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => deactivateUser(user.id)}
                                          className="bg-destructive text-destructive-foreground"
                                        >
                                          Deactivate
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => reactivateUser(user.id)}
                                  >
                                    <RotateCcw className="w-4 h-4" />
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audit Logs</CardTitle>
              <CardDescription>
                Track all administrative actions and system changes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Table</TableHead>
                      <TableHead>Target ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          {new Date(log.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.action}</Badge>
                        </TableCell>
                        <TableCell>{log.target_table}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {log.target_id}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>
                Configure system-wide settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Authentication</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span>Email Confirmation Required</span>
                          <Badge variant="outline">Enabled</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Auto-approve New Users</span>
                          <Badge variant="secondary">Disabled</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Security</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span>Row Level Security</span>
                          <Badge variant="default">Enabled</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Admin Audit Logging</span>
                          <Badge variant="default">Enabled</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
              <CardDescription>
                Database and system health information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Total Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{users.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Active Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {users.filter(u => u.is_active).length}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Pending Approvals</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {users.filter(u => !u.is_approved && u.is_active).length}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Admin Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {users.filter(u => u.role === 'admin' && u.is_active).length}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
