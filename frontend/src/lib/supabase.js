import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://diznruaymwfvxmgbtyie.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpem5ydWF5bXdmdnhtZ2J0eWllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc0MTUwMTgsImV4cCI6MjEwMjk5MTAxOH0.PiN8cL6tqrvfRFd95FQxVNoPBfzYrRDC-TEoApmBfKc';

export const supabase = createClient(supabaseUrl, supabaseKey);
