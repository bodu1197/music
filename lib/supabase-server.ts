import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn('Missing Supabase environment variables for server client');
}

// 🚀 서버 사이드 전용 Supabase 클라이언트 (API Route용)
// createBrowserClient 대신 createClient 사용
export const supabaseServer = createClient(supabaseUrl || '', supabaseKey || '');
