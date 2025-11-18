import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { keywords, type Keyword } from '../lib/api';
import { toast } from 'sonner';

// Fetch keywords list
export function useKeywords() {
  return useQuery<Keyword[]>({
    queryKey: ['keywords'],
    queryFn: () => keywords.list(),
    staleTime: 60000, // 1 minute
  });
}

// Fetch single keyword
export function useKeyword(id: string | undefined) {
  return useQuery<Keyword>({
    queryKey: ['keyword', id],
    queryFn: () => keywords.get(id!),
    enabled: !!id,
  });
}

// Create keyword mutation
export function useCreateKeyword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (keyword: Omit<Keyword, 'id' | 'created_at' | 'updated_at' | 'leads_found'>) =>
      keywords.create(keyword),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keywords'] });
      toast.success('Keyword created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create keyword');
    },
  });
}

// Update keyword mutation
export function useUpdateKeyword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Keyword> }) =>
      keywords.update(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['keywords'] });
      queryClient.invalidateQueries({ queryKey: ['keyword', data.id] });
      toast.success('Keyword updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update keyword');
    },
  });
}

// Delete keyword mutation
export function useDeleteKeyword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => keywords.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keywords'] });
      toast.success('Keyword deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete keyword');
    },
  });
}

// Toggle keyword enabled status
export function useToggleKeyword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      keywords.update(id, { enabled }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['keywords'] });
      toast.success(data.enabled ? 'Keyword enabled' : 'Keyword disabled');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to toggle keyword');
    },
  });
}