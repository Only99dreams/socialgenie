import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const planSchema = z.object({
  name: z.string().trim().min(1, 'Plan name is required').max(50, 'Name must be less than 50 characters'),
  description: z.string().trim().max(200, 'Description must be less than 200 characters').optional(),
  price_monthly: z.coerce.number().min(0, 'Price must be 0 or greater'),
  price_yearly: z.coerce.number().min(0, 'Price must be 0 or greater').optional(),
  features: z.string().trim().optional(),
  trial_days: z.coerce.number().int().min(0).max(365).default(0),
  sort_order: z.coerce.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
});

type PlanFormValues = z.infer<typeof planSchema>;

interface CreatePlanDialogProps {
  onPlanCreated: () => void;
}

export function CreatePlanDialog({ onPlanCreated }: CreatePlanDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<PlanFormValues>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      name: '',
      description: '',
      price_monthly: 0,
      price_yearly: undefined,
      features: '',
      trial_days: 0,
      sort_order: 0,
      is_active: true,
    },
  });

  const onSubmit = async (data: PlanFormValues) => {
    setIsSubmitting(true);
    try {
      // Parse features from comma-separated string to array
      const featuresArray = data.features
        ? data.features.split(',').map(f => f.trim()).filter(f => f.length > 0)
        : [];

      const { error } = await supabase
        .from('subscription_plans')
        .insert([{
          name: data.name,
          description: data.description || null,
          price_monthly: data.price_monthly,
          price_yearly: data.price_yearly || null,
          features: featuresArray,
          trial_days: data.trial_days,
          sort_order: data.sort_order,
          is_active: data.is_active,
        }]);

      if (error) throw error;

      toast({
        title: 'Plan Created',
        description: `${data.name} has been created successfully`,
      });

      form.reset();
      setOpen(false);
      onPlanCreated();
    } catch (error) {
      console.error('Error creating plan:', error);
      toast({
        title: 'Error',
        description: 'Failed to create subscription plan',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Create Plan
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Create Subscription Plan</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto flex-1 pr-2">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plan Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Pro, Enterprise" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Brief description of the plan" 
                      className="resize-none"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price_monthly"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Price ($)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price_yearly"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Yearly Price ($)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        min="0" 
                        placeholder="Optional"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="features"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Features</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter features separated by commas (e.g. Unlimited posts, Priority support, Analytics)"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Separate each feature with a comma
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="trial_days"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Free Trial (Days)</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" max="365" placeholder="0 = no trial" {...field} />
                  </FormControl>
                  <FormDescription>
                    Set to 0 for no free trial
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sort_order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sort Order</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormDescription>
                      Lower numbers appear first
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Active</FormLabel>
                    <FormControl>
                      <div className="flex items-center h-10">
                        <Switch 
                          checked={field.value} 
                          onCheckedChange={field.onChange}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Visible to users
                    </FormDescription>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Plan
              </Button>
            </div>
          </form>
        </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
