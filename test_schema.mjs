import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        env[parts[0].trim()] = parts.slice(1).join('=').trim();
    }
});

const url = env['VITE_SUPABASE_URL'] + '/rest/v1/';
const key = env['VITE_SUPABASE_ANON_KEY'];

fetch(url, {
    method: 'GET',
    headers: {
        'apikey': key,
        'Authorization': 'Bearer ' + key
    }
}).then(res => res.json()).then(data => {
    const cashbookDef = data.definitions['cashbook'];
    if (cashbookDef) {
        console.log("Cashbook Columns:", Object.keys(cashbookDef.properties));
    } else {
        console.log("cashbook definition not found");
    }
}).catch(e => console.error(e));
