import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'example-key';

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Missing Supabase environment variables - functionality may be limited');
}

// This client triggers cookie storage in the browser, essential for middleware to see the session
export const supabase = createBrowserClient(supabaseUrl || '', supabaseAnonKey || '');

