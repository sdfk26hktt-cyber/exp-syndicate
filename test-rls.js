import { supabase } from './src/lib/supabase.js';

async function test() {
  const { data, error } = await supabase.from('agents').select('id').limit(1);
  console.log("Agents query result:", data, error);
}

test();
