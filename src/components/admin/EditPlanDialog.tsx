import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Edit } from 'lucide-react';
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
  name: z.string().trim().min(1).max(50),
  description: z.string().trim().max(200).optional(),
  price_monthly: z.coerce.number().min(0),
  price_yearly: z.coerce.number().min(0).optional(),
  features: z.string().trim().optional(),
  trial_days: z.coerce.number().int().min(0).max(365),
  sort_order: z.coerce.number().int().min(0),
  is_active: z.boolean(),
});

type PlanFormValues = z.infer<typeof planSchema>;

interface EditPlanDialogProps {
  plan: {
    id: string;
    name: string;
    description: string | null;
    price_monthly: number;
    price_yearly: number | null;
    features: unknown;
    trial_days: number;
    is_active: boolean | null;
    sort_order: number | null;
  };
  onPlanUpdated: () => void;
}

export function EditPlanDialog({ plan, onPlanUpdated }: EditPlanDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const featuresStr = Array.isArray(plan.features)
    ? (plan.features as string[]).join(', ')
    : '';

  const form = useForm<PlanFormValues>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      name: plan.name,
      description: plan.description || '',
      price_monthly: plan.price_monthly,
      price_yearly: plan.price_yearly ?? undefined,
      features: featuresStr,
      trial_days: plan.trial_days,
      sort_order: plan.sort_order ?? 0,
      is_active: plan.is_active ?? true,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: plan.name,
        description: plan.description || '',
        price_monthly: plan.price_monthly,
        price_yearly: plan.price_yearly ?? undefined,
        features: featuresStr,
        trial_days: plan.trial_days,
        sort_order: plan.sort_order ?? 0,
        is_active: plan.is_active ?? true,
      });
    }
  }, [open, plan]);

  const onSubmit = async (data: PlanFormValues) => {
    setIsSubmitting(true);
    try {
      const featuresArray = data.features
        ? data.features.split(',').map(f => f.trim()).filter(f => f.length > 0)
        : [];

      const { error } = await supabase
        .from('subscription_plans')
        .update({
          name: data.name,
          description: data.description || null,
          price_monthly: data.price_monthly,
          price_yearly: data.price_yearly || null,
          features: featuresArray,
          trial_days: data.trial_days,
          sort_order: data.sort_order,
          is_active: data.is_active,
        })
        .eq('id', plan.id);

      if (error) throw error;

      toast({ title: 'Plan Updated', description: `${data.name} has been updated` });
      setOpen(false);
      onPlanUpdated();
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'Failed to update plan', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-2 w-full px-2 py-1.5 text-sm">
          <Edit className="w-4 h-4" />
          Edit Plan
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit {plan.name}</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto flex-1 pr-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Plan Name</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl><Textarea className="resize-none" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="price_monthly" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Price ($)</FormLabel>
                    <FormControl><Input type="number" step="0.01" min="0" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="price_yearly" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Yearly Price ($)</FormLabel>
                    <FormControl><Input type="number" step="0.01" min="0" placeholder="Optional" {...field} value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="features" render={({ field }) => (
                <FormItem>
                  <FormLabel>Features</FormLabel>
                  <FormControl><Textarea className="resize-none" placeholder="Comma-separated" {...field} /></FormControl>
                  <FormDescription>Separate each feature with a comma</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="trial_days" render={({ field }) => (
                <FormItem>
                  <FormLabel>Free Trial (Days)</FormLabel>
                  <FormControl><Input type="number" min="0" max="365" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="sort_order" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sort Order</FormLabel>
                    <FormControl><Input type="number" min="0" {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="is_active" render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Active</FormLabel>
                    <FormControl>
                      <div className="flex items-center h-10">
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </div>
                    </FormControl>
                  </FormItem>
                )} />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
