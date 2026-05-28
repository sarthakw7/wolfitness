import { createClient } from '@/lib/supabaseServer';
import { redirect } from 'next/navigation';
import { NutritionChat } from '@/components/dashboard/NutritionChat';
import Navbar from '@/components/Navbar';

export const metadata = {
  title: 'AI Nutrition | WFF',
};

export default async function NutritionChatPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/auth/login');
  }

  // Use the standalone backend API url
  const apiUrl = process.env.NEXT_PUBLIC_API_URL 
    ? `${process.env.NEXT_PUBLIC_API_URL}/api/ai/nutrition/chat`
    : '/api/ai/nutrition/chat';

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      
      <main className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-black uppercase tracking-tighter">AI Nutritionist</h1>
          <p className="text-zinc-400 text-sm font-bold uppercase tracking-widest mt-1">
            Real-time personalized dietary coaching
          </p>
        </div>

        <NutritionChat token={session.access_token} apiUrl={apiUrl} />
      </main>
    </div>
  );
}
