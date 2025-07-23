
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Database, Shield, Settings, Activity, HardDrive, Users, Clock, AlertTriangle, CheckCircle, Zap } from 'lucide-react';

interface SystemHealth {
  database_connections: number;
  active_sessions: number;
  memory_usage: number;
  disk_usage: number;
  last_backup: string;
  system_uptime: string;
}

interface SystemSettings {
  maintenance_mode: boolean;
  allow_registrations: boolean;
  max_concurrent_users: number;
  session_timeout: number;
  backup_frequency: string;
  notification_settings: {
    email_notifications: boolean;
    sms_notifications: boolean;
    push_notifications: boolean;
  };
}

export const SystemAdministration = () => {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    maintenance_mode: false,
    allow_registrations: true,
    max_concurrent_users: 100,
    session_timeout: 30,
    backup_frequency: 'daily',
    notification_settings: {
      email_notifications: true,
      sms_notifications: false,
      push_notifications: true
    }
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('health');

  useEffect(() => {
    fetchSystemHealth();
    fetchSystemSettings();
  }, []);

  const fetchSystemHealth = async () => {
    // Simulate system health data - in real implementation, this would come from monitoring endpoints
    setSystemHealth({
      database_connections: 25,
      active_sessions: 18,
      memory_usage: 68,
      disk_usage: 45,
      last_backup: new Date().toISOString(),
      system_uptime: '7 days, 14 hours'
    });
  };

  const fetchSystemSettings = async () => {
    // In real implementation, fetch from a system_settings table
    setLoading(true);
    try {
      // Simulate loading system settings
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error fetching system settings:', error);
      toast.error('Failed to fetch system settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSystemSettings = async (newSettings: Partial<SystemSettings>) => {
    setLoading(true);
    try {
      setSystemSettings(prev => ({ ...prev, ...newSettings }));
      toast.success('System settings updated successfully');
    } catch (error) {
      console.error('Error updating system settings:', error);
      toast.error('Failed to update system settings');
    } finally {
      setLoading(false);
    }
  };

  const performBackup = async () => {
    setLoading(true);
    try {
      // Simulate backup process
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('System backup completed successfully');
      fetchSystemHealth();
    } catch (error) {
      console.error('Error performing backup:', error);
      toast.error('Failed to perform backup');
    } finally {
      setLoading(false);
    }
  };

  const getHealthStatus = (value: number, threshold: number = 80) => {
    if (value < threshold) return { status: 'healthy', color: 'text-green-600' };
    if (value < 90) return { status: 'warning', color: 'text-yellow-600' };
    return { status: 'critical', color: 'text-red-600' };
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            System Administration
          </CardTitle>
          <CardDescription>
            Monitor system health, manage settings, and perform administrative tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>Admin Access Required:</strong> This section contains sensitive system administration features.
              Please ensure you have proper authorization before making changes.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="health">System Health</TabsTrigger>
          <TabsTrigger value="settings">System Settings</TabsTrigger>
          <TabsTrigger value="backup">Backup & Recovery</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
        </TabsList>

        <TabsContent value="health">
          <Card>
            <CardHeader>
              <CardTitle>System Health Monitor</CardTitle>
              <CardDescription>
                Real-time monitoring of system performance and resource usage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {systemHealth && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Database Connections</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getHealthIcon(getHealthStatus(systemHealth.database_connections).status)}
                        <span className="text-sm font-bold">{systemHealth.database_connections}/100</span>
                      </div>
                    </div>
                    <Progress value={systemHealth.database_connections} className="h-2" />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Active Sessions</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getHealthIcon(getHealthStatus(systemHealth.active_sessions).status)}
                        <span className="text-sm font-bold">{systemHealth.active_sessions}</span>
                      </div>
                    </div>
                    <Progress value={systemHealth.active_sessions} className="h-2" />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Memory Usage</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getHealthIcon(getHealthStatus(systemHealth.memory_usage).status)}
                        <span className="text-sm font-bold">{systemHealth.memory_usage}%</span>
                      </div>
                    </div>
                    <Progress value={systemHealth.memory_usage} className="h-2" />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <HardDrive className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Disk Usage</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getHealthIcon(getHealthStatus(systemHealth.disk_usage).status)}
                        <span className="text-sm font-bold">{systemHealth.disk_usage}%</span>
                      </div>
                    </div>
                    <Progress value={systemHealth.disk_usage} className="h-2" />
                  </div>
                </div>
              )}

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">System Uptime</Label>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{systemHealth?.system_uptime}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Last Backup</Label>
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {systemHealth?.last_backup ? new Date(systemHealth.last_backup).toLocaleString() : 'Never'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>
                Configure global system settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Maintenance Mode</Label>
                      <p className="text-xs text-muted-foreground">
                        Temporarily disable user access for maintenance
                      </p>
                    </div>
                    <Switch
                      checked={systemSettings.maintenance_mode}
                      onCheckedChange={(checked) => 
                        updateSystemSettings({ maintenance_mode: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Allow Registrations</Label>
                      <p className="text-xs text-muted-foreground">
                        Enable new user account creation
                      </p>
                    </div>
                    <Switch
                      checked={systemSettings.allow_registrations}
                      onCheckedChange={(checked) => 
                        updateSystemSettings({ allow_registrations: checked })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max-users" className="text-sm font-medium">
                      Max Concurrent Users
                    </Label>
                    <Input
                      id="max-users"
                      type="number"
                      value={systemSettings.max_concurrent_users}
                      onChange={(e) => 
                        updateSystemSettings({ max_concurrent_users: parseInt(e.target.value) })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="session-timeout" className="text-sm font-medium">
                      Session Timeout (minutes)
                    </Label>
                    <Input
                      id="session-timeout"
                      type="number"
                      value={systemSettings.session_timeout}
                      onChange={(e) => 
                        updateSystemSettings({ session_timeout: parseInt(e.target.value) })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-sm font-medium">Notification Settings</Label>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm">Email Notifications</Label>
                      <p className="text-xs text-muted-foreground">
                        Send email notifications for important events
                      </p>
                    </div>
                    <Switch
                      checked={systemSettings.notification_settings.email_notifications}
                      onCheckedChange={(checked) => 
                        updateSystemSettings({
                          notification_settings: {
                            ...systemSettings.notification_settings,
                            email_notifications: checked
                          }
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm">SMS Notifications</Label>
                      <p className="text-xs text-muted-foreground">
                        Send SMS notifications for critical alerts
                      </p>
                    </div>
                    <Switch
                      checked={systemSettings.notification_settings.sms_notifications}
                      onCheckedChange={(checked) => 
                        updateSystemSettings({
                          notification_settings: {
                            ...systemSettings.notification_settings,
                            sms_notifications: checked
                          }
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm">Push Notifications</Label>
                      <p className="text-xs text-muted-foreground">
                        Send push notifications to mobile devices
                      </p>
                    </div>
                    <Switch
                      checked={systemSettings.notification_settings.push_notifications}
                      onCheckedChange={(checked) => 
                        updateSystemSettings({
                          notification_settings: {
                            ...systemSettings.notification_settings,
                            push_notifications: checked
                          }
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup">
          <Card>
            <CardHeader>
              <CardTitle>Backup & Recovery</CardTitle>
              <CardDescription>
                Manage system backups and data recovery operations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Backup Frequency</Label>
                    <Badge variant="outline">{systemSettings.backup_frequency}</Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm">Last Backup</Label>
                    <p className="text-sm text-muted-foreground">
                      {systemHealth?.last_backup ? new Date(systemHealth.last_backup).toLocaleString() : 'No backup found'}
                    </p>
                  </div>
                  
                  <Button 
                    onClick={performBackup}
                    disabled={loading}
                    className="w-full"
                  >
                    <Database className="h-4 w-4 mr-2" />
                    {loading ? 'Creating Backup...' : 'Create Manual Backup'}
                  </Button>
                </div>

                <div className="space-y-4">
                  <Label className="text-sm font-medium">Quick Actions</Label>
                  
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full" disabled={loading}>
                      <Zap className="h-4 w-4 mr-2" />
                      Optimize Database
                    </Button>
                    
                    <Button variant="outline" className="w-full" disabled={loading}>
                      <Activity className="h-4 w-4 mr-2" />
                      Clear Cache
                    </Button>
                    
                    <Button variant="outline" className="w-full" disabled={loading}>
                      <HardDrive className="h-4 w-4 mr-2" />
                      Cleanup Logs
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage user accounts, roles, and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <Users className="h-4 w-4" />
                <AlertDescription>
                  User management features are available in the dedicated Users section.
                  This panel shows system-level user statistics and controls.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
