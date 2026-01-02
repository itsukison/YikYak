import { useMutation } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { supabase } from '../../adapters/supabaseClient';

export function useAccountDeletion() {
  const { user, signOut } = useAuth();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        throw new Error('No user logged in');
      }

      // Soft delete: update status instead of hard delete
      const { error } = await supabase
        .from('users')
        .update({
          status: 'deleted',
          deleted_at: new Date().toISOString(),
          push_token: null,
          avatar_url: null
        })
        .eq('id', user.id);

      if (error) throw error;
    },
    onSuccess: async () => {
      // Sign out after successful deletion
      await signOut();
    }
  });

  return {
    deleteAccount: deleteMutation.mutateAsync,
    deleting: deleteMutation.isPending,
    error: deleteMutation.error
  };
}
