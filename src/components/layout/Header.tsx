
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { DKLogo } from '@/components/ui/dk-logo';

export const Header = () => {
  const { profile, signOut } = useAuth();

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'hr': return 'bg-dk-secondary/10 text-dk-secondary border-dk-secondary/20';
      case 'manager': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <header className="border-b bg-dk-primary px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        <DKLogo size="md" showText={true} />
        
        {profile && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 text-dk-text hover:bg-dk-primary/80">
                <User className="w-4 h-4" />
                <span className="text-dk-text">{profile.employee_id || profile.email}</span>
                <Badge variant="outline" className={getRoleColor(profile.role)}>
                  {profile.role.toUpperCase()}
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="w-4 h-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-destructive hover:text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
};
