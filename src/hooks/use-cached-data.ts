import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';

// Types for caching
export interface KanbanBoard {
  id: string;
  title: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  color?: string;
  description?: string;
}

// Simple hook for transactions with proper caching
export function useTransactions() {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: ['transactions', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,  // 5 minutes
    gcTime: 10 * 60 * 1000,    // 10 minutes
    refetchOnWindowFocus: false
  });
}

// Simple hook for tasks with proper caching
export function useTasks() {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: ['tasks', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false
  });
}

// Simple hook for pomodoro sessions with proper caching
export function usePomodoroSessions() {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: ['pomodoro_sessions', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('pomodoro_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false
  });
}

// Simple hook for kanban boards with proper caching
export function useKanbanBoards() {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery<KanbanBoard[]>({
    queryKey: ['kanban_boards', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('kanban_boards')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false
  });
}

// Simple hook for transaction categories with proper caching
export function useTransactionCategories(type: 'income' | 'expense') {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: ['transaction_categories', type, userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('transaction_categories')
        .select('*')
        .eq('type', type)
        .or(`user_id.eq.${userId},is_system.eq.true`)
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false
  });
} 