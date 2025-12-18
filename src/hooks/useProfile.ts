import { useQuery } from '@tanstack/react-query';
import { useSupabase } from '@/components/SupabaseProvider';

export function useProfile() {
  const { supabase, session } = useSupabase();

  return useQuery({
    queryKey: ['profile', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      
      const { data, error } = await supabase!
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      return data;
    },
    enabled: !!session?.user?.id, // Only run query if we have a user ID
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}
