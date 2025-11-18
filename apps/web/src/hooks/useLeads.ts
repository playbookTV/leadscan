import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leads, type Lead, type PaginatedResponse, type Stats } from '../lib/api';
import { toast } from 'sonner';

// Fetch leads list
export function useLeads(params?: {
  platform?: string;
  status?: string;
  score_min?: number;
  score_max?: number;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}) {
  return useQuery<PaginatedResponse<Lead>>({
    queryKey: ['leads', params],
    queryFn: () => leads.list(params),
    staleTime: 30000, // 30 seconds
  });
}

// Fetch single lead
export function useLead(id: string | undefined) {
  return useQuery<Lead>({
    queryKey: ['lead', id],
    queryFn: () => leads.get(id!),
    enabled: !!id,
  });
}

// Fetch lead stats
export function useLeadStats() {
  return useQuery<Stats>({
    queryKey: ['lead-stats'],
    queryFn: () => leads.stats(),
    staleTime: 60000, // 1 minute
    refetchInterval: 60000, // Refetch every minute
  });
}

// Update lead mutation
export function useUpdateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Lead> }) =>
      leads.update(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead', data.id] });
      queryClient.invalidateQueries({ queryKey: ['lead-stats'] });
      toast.success('Lead updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update lead');
    },
  });
}

// Lead action mutation
export function useLeadAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      action,
      notes
    }: {
      id: string;
      action: 'contact' | 'skip' | 'win' | 'lose' | 'review';
      notes?: string;
    }) => leads.action(id, action, notes),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead', data.id] });
      queryClient.invalidateQueries({ queryKey: ['lead-stats'] });

      const actionMessages = {
        contact: 'Lead marked as contacted',
        skip: 'Lead skipped',
        win: 'Lead marked as won! 🎉',
        lose: 'Lead marked as lost',
        review: 'Lead marked for review',
      };

      toast.success(actionMessages[variables.action]);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to perform action');
    },
  });
}

// Add note mutation
export function useAddNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) =>
      leads.addNote(id, note),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['lead', data.id] });
      toast.success('Note added successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to add note');
    },
  });
}

// Delete lead mutation
export function useDeleteLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => leads.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead-stats'] });
      toast.success('Lead deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete lead');
    },
  });
}