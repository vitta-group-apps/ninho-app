import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xgjupcwyekkmizocvzil.supabase.co';
const supabaseAnonKey = 'sb_publishable_CQer0q1_NwoAisQ7W2RnaA_YN4kTp7S';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
