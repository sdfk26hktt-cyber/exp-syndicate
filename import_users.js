import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { parse } from 'csv-parse/sync';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// We need the DEFAULT_PHASES from AgentContext.
// Since we can't easily import it here without babel/vite, we'll redefine a minimal version
// Actually, it's better to just leave it as an empty array or a simplified version, 
// but since they are existing agents, they probably don't need the onboarding phases anyway.
// I'll provide an empty phases array and set them to active.

const DEFAULT_PHASES = []; // For existing agents

const importCsv = async () => {
  try {
    const csvContent = fs.readFileSync('downline5-28 - Rev Share Contact info.csv', 'utf8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true
    });

    console.log(`Found ${records.length} records in CSV.`);
    
    let successCount = 0;
    let errorCount = 0;

    for (const record of records) {
      const email = record['Agent Primary Email']?.trim();
      if (!email) {
        console.log(`Skipping record with no email: ${record['Agent Name']}`);
        continue;
      }

      const agentData = {
        id: email,
        name: record['Agent Name']?.trim(),
        xp: 0,
        phases: [],
        sponsor: { name: 'Brian Burds', phone: '(915) 256-6989', email: 'brian@brianburds.com' },
        profile: {
          phone: record['Agent Phone Number']?.trim() || '',
          address: '',
          birthday: '',
          licenseNumber: '',
          interests: '',
          goals: ''
        },
        status: 'active',
        current_phase: 'completed'
      };

      // Upsert the record
      const { error } = await supabase
        .from('agents')
        .upsert(agentData, { onConflict: 'id' });

      if (error) {
        console.error(`Error inserting ${email}:`, error.message);
        errorCount++;
      } else {
        successCount++;
        console.log(`Successfully imported: ${email}`);
      }
    }

    console.log(`\nImport complete! Success: ${successCount}, Errors: ${errorCount}`);
  } catch (err) {
    console.error('Failed to import CSV:', err);
  }
};

importCsv();
