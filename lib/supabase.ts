import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://bsoqfgwexmgxribhzzkf.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzb3FmZ3dleG1neHJpYmh6emtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyNTE2NjUsImV4cCI6MjA4MjgyNzY2NX0.19rA3UyOuoXu0nK0nQfiKrbpP_3qTZAQyYxunIJ9_PI";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
