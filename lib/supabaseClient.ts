import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fkhbocydemomimcnodeq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZraGJvY3lkZW1vbWltY25vZGVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MDE2NTcsImV4cCI6MjA4MDI3NzY1N30.W382GmAcHwpRoIzKp7vyd3f4DO3YJnKEvnr6WpRCFW8';

export const supabase = createClient(supabaseUrl, supabaseKey);