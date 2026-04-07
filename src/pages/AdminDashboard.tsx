import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Users, 
  Building2, 
  BarChart3, 
  Settings, 
  Shield, 
  AlertTriangle,
  Loader2,
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Trash2,
  UserCog,
  CreditCard,
  Edit,
  Check,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { CreatePlanDialog } from '@/components/admin/CreatePlanDialog';
import { EditPlanDialog } from '@/components/admin/EditPlanDialog';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
}

interface Business {
  id: string;
  name: string;
  website_url: string;
  industry: string | null;
  created_at: string;
  user_id: string;
}

interface UserRole {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number | null;
  features: unknown;
  trial_days: number;
  is_active: boolean | null;
  sort_order: number | null;
  created_at: string;
}

interface Payment {
  id: string;
  user_id: string;
  plan_id: string | null;
  amount: number;
  payment_proof_url: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  plan?: SubscriptionPlan | null;
}

interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string | null;
  status: string;
  starts_at: string;
  ends_at: string | null;
  created_at: string;
  plan?: SubscriptionPlan | null;
}

export default function AdminDashboard() {
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';
  const setActiveTab = (tab: string) => {
    if (tab === 'overview') {
      setSearchParams({});
    } else {
      setSearchParams({ tab });
    }
  };
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [userSubscriptions, setUserSubscriptions] = useState<UserSubscription[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to access the admin dashboard.',
        variant: 'destructive',
      });
      navigate('/dashboard');
    }
  }, [isAdmin, adminLoading, navigate, toast]);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch businesses
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select('*')
        .order('created_at', { ascending: false });

      if (businessError) throw businessError;
      setBusinesses(businessData || []);

      // Fetch user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (rolesError) throw rolesError;
      setUserRoles(rolesData || []);

      // Fetch subscription plans
      const { data: plansData, error: plansError } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('sort_order', { ascending: true });

      if (plansError) throw plansError;
      setSubscriptionPlans(plansData || []);

      // Fetch user subscriptions
      const { data: subsData, error: subsError } = await supabase
        .from('user_subscriptions')
        .select('*, plan:subscription_plans(*)')
        .order('created_at', { ascending: false });

      if (subsError) throw subsError;
      setUserSubscriptions(subsData || []);

      // Fetch payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*, plan:subscription_plans(*)')
        .order('created_at', { ascending: false });

      if (paymentsError) throw paymentsError;
      setPayments((paymentsData as any) || []);

    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load admin data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'moderator' | 'user') => {
    try {
      // Check if user already has a role
      const existingRole = userRoles.find(r => r.user_id === userId);

      if (existingRole) {
        // Update existing role
        const { error } = await supabase
          .from('user_roles')
          .update({ role: newRole })
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        // Insert new role
        const { error } = await supabase
          .from('user_roles')
          .insert([{ user_id: userId, role: newRole }]);

        if (error) throw error;
      }

      toast({
        title: 'Role Updated',
        description: `User role has been changed to ${newRole}`,
      });

      fetchData();
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user role',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteBusiness = async (businessId: string) => {
    try {
      const { error } = await supabase
        .from('businesses')
        .delete()
        .eq('id', businessId);

      if (error) throw error;

      toast({
        title: 'Business Deleted',
        description: 'The business has been removed',
      });

      fetchData();
    } catch (error) {
      console.error('Error deleting business:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete business',
        variant: 'destructive',
      });
    }
  };

  const handleTogglePlanStatus = async (planId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('subscription_plans')
        .update({ is_active: !currentStatus })
        .eq('id', planId);

      if (error) throw error;

      toast({
        title: 'Plan Updated',
        description: `Plan has been ${!currentStatus ? 'activated' : 'deactivated'}`,
      });

      fetchData();
    } catch (error) {
      console.error('Error updating plan:', error);
      toast({
        title: 'Error',
        description: 'Failed to update plan status',
        variant: 'destructive',
      });
    }
  };

  const handleDeletePlan = async (planId: string) => {
    try {
      const { error } = await supabase
        .from('subscription_plans')
        .delete()
        .eq('id', planId);

      if (error) throw error;

      toast({
        title: 'Plan Deleted',
        description: 'The subscription plan has been removed',
      });

      fetchData();
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete plan',
        variant: 'destructive',
      });
    }
  };

  const handlePaymentAction = async (paymentId: string, action: 'approved' | 'rejected', userId: string, planId: string | null) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { error } = await supabase
        .from('payments')
        .update({ 
          status: action, 
          reviewed_at: new Date().toISOString(),
          reviewed_by: session?.user.id || null,
        } as any)
        .eq('id', paymentId);

      if (error) throw error;

      // If approved, activate user subscription
      if (action === 'approved' && planId) {
        // Check for existing subscription
        const { data: existingSub } = await supabase
          .from('user_subscriptions')
          .select('id')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existingSub) {
          await supabase.from('user_subscriptions')
            .update({ plan_id: planId, status: 'active', ends_at: null } as any)
            .eq('id', existingSub.id);
        } else {
          await supabase.from('user_subscriptions').insert({
            user_id: userId,
            plan_id: planId,
            status: 'active',
          });
        }
      }

      toast({
        title: action === 'approved' ? 'Payment Approved' : 'Payment Rejected',
        description: action === 'approved' ? 'User subscription has been activated' : 'Payment has been rejected',
      });

      fetchData();
    } catch (error) {
      console.error('Error updating payment:', error);
      toast({ title: 'Error', description: 'Failed to update payment', variant: 'destructive' });
    }
  };

  if (adminLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const filteredBusinesses = businesses.filter(b => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.website_url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    totalBusinesses: businesses.length,
    totalAdmins: userRoles.filter(r => r.role === 'admin').length,
    totalModerators: userRoles.filter(r => r.role === 'moderator').length,
    totalUsers: userRoles.filter(r => r.role === 'user').length,
    totalPlans: subscriptionPlans.length,
    activeSubscriptions: userSubscriptions.filter(s => s.status === 'active').length,
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AdminSidebar />
        
        <main className="flex-1 p-3 md:p-6 overflow-auto">
          {/* Header */}
          <div className="mb-4 md:mb-6 flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <SidebarTrigger className="md:hidden shrink-0" />
              <div className="min-w-0">
                <h1 className="text-xl md:text-3xl font-bold flex items-center gap-2">
                  <Shield className="w-6 h-6 md:w-8 md:h-8 text-primary shrink-0" />
                  <span className="truncate">Admin Dashboard</span>
                </h1>
                <p className="text-xs md:text-sm text-muted-foreground mt-0.5 line-clamp-1">Manage users, businesses, and platform settings</p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6"
          >
            <Card className="bg-card border-border">
              <CardContent className="p-3 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Businesses</p>
                    <p className="text-2xl font-bold mt-1">{stats.totalBusinesses}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-3 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Admins</p>
                    <p className="text-2xl font-bold mt-1">{stats.totalAdmins}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-red-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-3 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Moderators</p>
                    <p className="text-2xl font-bold mt-1">{stats.totalModerators}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <UserCog className="w-6 h-6 text-amber-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-3 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Regular Users</p>
                    <p className="text-2xl font-bold mt-1">{stats.totalUsers}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="overflow-x-auto -mx-3 px-3 md:mx-0 md:px-0 mb-4 md:mb-6">
                <TabsList className="bg-card border border-border w-max md:w-auto">
                  <TabsTrigger value="overview" className="gap-1.5 text-xs md:text-sm">
                    <BarChart3 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    <span className="hidden sm:inline">Overview</span>
                  </TabsTrigger>
                  <TabsTrigger value="businesses" className="gap-1.5 text-xs md:text-sm">
                    <Building2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    <span className="hidden sm:inline">Businesses</span>
                  </TabsTrigger>
                  <TabsTrigger value="subscriptions" className="gap-1.5 text-xs md:text-sm">
                    <CreditCard className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    <span className="hidden sm:inline">Subscriptions</span>
                  </TabsTrigger>
                  <TabsTrigger value="roles" className="gap-1.5 text-xs md:text-sm">
                    <Users className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    <span className="hidden sm:inline">Roles</span>
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="gap-1.5 text-xs md:text-sm">
                    <Settings className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    <span className="hidden sm:inline">Settings</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="overview">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle>Platform Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      <div className="p-4 rounded-lg bg-muted/30 border border-border">
                        <h4 className="font-semibold mb-2">Recent Activity</h4>
                        <p className="text-sm text-muted-foreground">
                          {businesses.length} businesses registered. {userRoles.length} users with assigned roles.
                        </p>
                      </div>
                      <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="w-6 h-6 text-amber-400" />
                          <div>
                            <p className="font-semibold">System Status</p>
                            <p className="text-sm text-muted-foreground">All systems operational</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="businesses">
                <Card className="bg-card border-border">
                  <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <CardTitle>All Businesses</CardTitle>
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search businesses..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Website</TableHead>
                            <TableHead>Industry</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="w-[70px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredBusinesses.map((business) => (
                            <TableRow key={business.id}>
                              <TableCell className="font-medium">{business.name}</TableCell>
                              <TableCell className="text-muted-foreground">{business.website_url}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{business.industry || 'N/A'}</Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {new Date(business.created_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem>
                                      <Eye className="w-4 h-4 mr-2" />
                                      View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      className="text-destructive"
                                      onClick={() => handleDeleteBusiness(business.id)}
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                          {filteredBusinesses.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                No businesses found
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="subscriptions">
                <Card className="bg-card border-border">
                  <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <CardTitle>Subscription Plans</CardTitle>
                    <CreatePlanDialog onPlanCreated={fetchData} />
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                      <Table>
                         <TableHeader>
                          <TableRow>
                            <TableHead>Plan Name</TableHead>
                            <TableHead>Monthly Price</TableHead>
                            <TableHead>Yearly Price</TableHead>
                            <TableHead>Trial</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Subscribers</TableHead>
                            <TableHead className="w-[70px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {subscriptionPlans.map((plan) => (
                            <TableRow key={plan.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{plan.name}</p>
                                  {plan.description && (
                                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>${plan.price_monthly}/mo</TableCell>
                              <TableCell>{plan.price_yearly ? `$${plan.price_yearly}/yr` : '-'}</TableCell>
                              <TableCell>{plan.trial_days > 0 ? `${plan.trial_days} days` : 'None'}</TableCell>
                              <TableCell>
                                <Badge className={plan.is_active ? 'bg-green-500/20 text-green-400' : 'bg-muted text-muted-foreground'}>
                                  {plan.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {userSubscriptions.filter(s => s.plan_id === plan.id && s.status === 'active').length}
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem asChild>
                                      <EditPlanDialog plan={plan as any} onPlanUpdated={fetchData} />
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleTogglePlanStatus(plan.id, plan.is_active)}>
                                      {plan.is_active ? (
                                        <>
                                          <X className="w-4 h-4 mr-2" />
                                          Deactivate
                                        </>
                                      ) : (
                                        <>
                                          <Check className="w-4 h-4 mr-2" />
                                          Activate
                                        </>
                                      )}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      className="text-destructive"
                                      onClick={() => handleDeletePlan(plan.id)}
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                          {subscriptionPlans.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                                No subscription plans created yet
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-card border-border mt-6">
                  <CardHeader>
                    <CardTitle>User Subscriptions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>User ID</TableHead>
                            <TableHead>Plan</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Started</TableHead>
                            <TableHead>Ends</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {userSubscriptions.map((sub) => (
                            <TableRow key={sub.id}>
                              <TableCell className="font-mono text-sm">{sub.user_id.slice(0, 8)}...</TableCell>
                              <TableCell>{sub.plan?.name || 'Unknown'}</TableCell>
                              <TableCell>
                                <Badge className={
                                  sub.status === 'active' ? 'bg-green-500/20 text-green-400' :
                                  sub.status === 'trial' ? 'bg-blue-500/20 text-blue-400' :
                                  sub.status === 'cancelled' ? 'bg-amber-500/20 text-amber-400' :
                                  'bg-red-500/20 text-red-400'
                                }>
                                  {sub.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {new Date(sub.starts_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {sub.ends_at ? new Date(sub.ends_at).toLocaleDateString() : '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                          {userSubscriptions.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                No user subscriptions yet
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Payments Management */}
                <Card className="bg-card border-border mt-6">
                  <CardHeader>
                    <CardTitle>Payment Proofs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {payments.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No payments submitted yet</p>
                    ) : (
                      <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>User ID</TableHead>
                            <TableHead>Plan</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Proof</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {payments.map((payment) => (
                            <TableRow key={payment.id}>
                              <TableCell className="font-mono text-sm">{payment.user_id.slice(0, 8)}...</TableCell>
                              <TableCell>{(payment.plan as any)?.name || 'Unknown'}</TableCell>
                              <TableCell>${payment.amount}</TableCell>
                              <TableCell>
                                {payment.payment_proof_url ? (
                                  <Button variant="link" size="sm" className="p-0 h-auto" onClick={async () => {
                                    const { data } = await supabase.storage.from('payment-proofs').createSignedUrl(payment.payment_proof_url!, 3600);
                                    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
                                  }}>
                                    View Proof
                                  </Button>
                                ) : '-'}
                              </TableCell>
                              <TableCell>
                                <Badge className={
                                  payment.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                                  payment.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                                  'bg-red-500/20 text-red-400'
                                }>
                                  {payment.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {new Date(payment.created_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                {payment.status === 'pending' && (
                                  <div className="flex gap-1">
                                    <Button size="sm" variant="outline" className="h-7 text-green-400" onClick={() => handlePaymentAction(payment.id, 'approved', payment.user_id, payment.plan_id)}>
                                      <Check className="w-3 h-3 mr-1" /> Approve
                                    </Button>
                                    <Button size="sm" variant="outline" className="h-7 text-red-400" onClick={() => handlePaymentAction(payment.id, 'rejected', payment.user_id, payment.plan_id)}>
                                      <X className="w-3 h-3 mr-1" /> Reject
                                    </Button>
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="roles">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle>User Roles Management</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>User ID</TableHead>
                            <TableHead>Current Role</TableHead>
                            <TableHead>Assigned</TableHead>
                            <TableHead>Change Role</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {userRoles.map((role) => (
                            <TableRow key={role.id}>
                              <TableCell className="font-mono text-sm">{role.user_id.slice(0, 8)}...</TableCell>
                              <TableCell>
                                <Badge className={
                                  role.role === 'admin' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                  role.role === 'moderator' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                                  'bg-green-500/20 text-green-400 border-green-500/30'
                                }>
                                  {role.role}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {new Date(role.created_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <Select
                                  defaultValue={role.role}
                                  onValueChange={(value) => handleRoleChange(role.user_id, value as 'admin' | 'moderator' | 'user')}
                                >
                                  <SelectTrigger className="w-32">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="moderator">Moderator</SelectItem>
                                    <SelectItem value="user">User</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                            </TableRow>
                          ))}
                          {userRoles.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                No user roles assigned yet
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle>Platform Settings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="p-4 rounded-lg border border-border">
                        <h4 className="font-semibold mb-1">Auto-confirm Email Signups</h4>
                        <p className="text-sm text-muted-foreground mb-3">Currently managed through backend authentication settings.</p>
                        <Badge variant="outline">Backend Managed</Badge>
                      </div>
                      <div className="p-4 rounded-lg border border-border">
                        <h4 className="font-semibold mb-1">Cron Jobs</h4>
                        <p className="text-sm text-muted-foreground mb-3">Comment auto-fetch runs every 15 minutes.</p>
                        <Badge className="bg-emerald-500/20 text-emerald-400">Active</Badge>
                      </div>
                      <div className="p-4 rounded-lg border border-border">
                        <h4 className="font-semibold mb-1">Storage Buckets</h4>
                        <p className="text-sm text-muted-foreground mb-3">post-images and post-videos buckets are configured and public.</p>
                        <Badge className="bg-emerald-500/20 text-emerald-400">Configured</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </main>
      </div>
    </SidebarProvider>
  );
}
