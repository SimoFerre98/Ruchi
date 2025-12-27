import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://zrqrcgvzitqtidlfywev.supabase.co";
const supabaseAnonKey = "sb_publishable_OVW2gnIW64c0Z14zYexpSw_V1xhTHq0";
const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);

export { supabase as s };
