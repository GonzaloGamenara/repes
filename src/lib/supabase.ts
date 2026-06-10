import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lsbedgdnbeuhpuyonvit.supabase.co';
const supabaseAnonKey = 'sb_publishable_-uyyRAuY8CojcNhC3GJ7ow_iyiz4TFG';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export default supabase;
