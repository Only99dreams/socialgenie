import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, User, Bell, Shield, Loader2, Save, Lock, Mail, Sun, Moon } from 'lucide-react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useTheme } from '@/hooks/useTheme';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { AvatarUpload } from '@/components/settings/AvatarUpload';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [business, setBusiness] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/login'); return; }
      setUser(session.user);

      const { data: biz } = await supabase
        .from('businesses').select('*').eq('user_id', session.user.id).limit(1).single();
      if (biz) setBusiness(biz);
      setIsLoading(false);
    };
    fetchData();
  }, [navigate]);

  const handleSaveBusiness = async () => {
    if (!business) return;
    const { error } = await supabase.from('businesses').update({
      name: business.name,
      website_url: business.website_url,
    }).eq('id', business.id);

    if (error) {
      toast({ title: 'Error saving', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Settings saved!' });
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast({ title: 'Password too short', description: 'Must be at least 6 characters.', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Passwords don\'t match', variant: 'destructive' });
      return;
    }
    setIsChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setIsChangingPassword(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Password updated successfully!' });
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const initials = user?.email?.slice(0, 2).toUpperCase() || '??';
  const createdAt = user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—';

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <DashboardSidebar />
          <main className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DashboardSidebar />
        <main className="flex-1 p-3 md:p-6 overflow-auto">
          <DashboardHeader 
            title="Settings"
            subtitle="Manage your account and preferences"
            icon={<Settings className="w-6 h-6 text-primary" />}
          />

          <div className="space-y-6 max-w-2xl">
            {/* Profile */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><User className="w-5 h-5" /> Profile</CardTitle>
                <CardDescription>Your account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <AvatarUpload
                    userId={user?.id}
                    currentUrl={business?.avatar_url || null}
                    initials={initials}
                    onUploaded={async (url) => {
                      if (business) {
                        await supabase.from('businesses').update({ avatar_url: url } as any).eq('id', business.id);
                        setBusiness({ ...business, avatar_url: url });
                      }
                    }}
                  />
                  <div>
                    <p className="font-medium">{user?.email}</p>
                    <p className="text-sm text-muted-foreground">Member since {createdAt}</p>
                  </div>
                </div>
                <Separator />
                <div className="grid gap-2">
                  <Label className="flex items-center gap-1.5"><Mail className="w-4 h-4" /> Email</Label>
                  <Input value={user?.email || ''} disabled className="mt-1" />
                  <p className="text-xs text-muted-foreground">Email cannot be changed from here.</p>
                </div>
              </CardContent>
            </Card>

            {/* Password Change */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Lock className="w-5 h-5" /> Change Password</CardTitle>
                <CardDescription>Update your account password</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>New Password</Label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Confirm Password</Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="mt-1"
                  />
                </div>
                <Button onClick={handleChangePassword} disabled={isChangingPassword} className="gap-2">
                  {isChangingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  Update Password
                </Button>
              </CardContent>
            </Card>

            {/* Business */}
            {business && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5" /> Business</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Business Name</Label>
                    <Input
                      value={business.name}
                      onChange={(e) => setBusiness({ ...business, name: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Website URL</Label>
                    <Input
                      value={business.website_url}
                      onChange={(e) => setBusiness({ ...business, website_url: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <Button onClick={handleSaveBusiness} className="gap-2">
                    <Save className="w-4 h-4" /> Save Changes
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Appearance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                  Appearance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Dark Mode</Label>
                    <p className="text-xs text-muted-foreground">Toggle between light and dark theme</p>
                  </div>
                  <Switch checked={theme === 'dark'} onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')} />
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Bell className="w-5 h-5" /> Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Email notifications for new comments</Label>
                  <Switch />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <Label>Weekly performance reports</Label>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
