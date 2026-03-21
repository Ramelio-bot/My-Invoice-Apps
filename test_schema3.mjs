import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('.env');
const envFile = fs.readFileSync(envPath, 'utf-8');
const urlMatch = envFile.match(/VITE_SUPABASE_URL=(.+)/);
const keyMatch = envFile.match(/VITE_SUPABASE_ANON_KEY=(.+)/);

if(urlMatch && keyMatch) {
  const supabase = createClient(urlMatch[1].trim(), keyMatch[1].trim());
  
  async function check() {
    console.log('Fetching schemas...');
    const { data: stock, error: e1 } = await supabase.from('kasir_stock_history').select('*').limit(1);
    console.log('kasir_stock_history:', stock && stock[0] ? Object.keys(stock[0]) : e1 || 'empty');
    
    const { data: cb, error: e2 } = await supabase.from('cashbook').select('*').limit(1);
    console.log('cashbook:', cb && cb[0] ? Object.keys(cb[0]) : e2 || 'empty');
    
    const { data: ph, error: e3 } = await supabase.from('kasir_points_history').select('*').limit(1);
    console.log('kasir_points_history:', ph && ph[0] ? Object.keys(ph[0]) : e3 || 'empty');
  }
  check();
} else {
  console.log('env not found');
}
