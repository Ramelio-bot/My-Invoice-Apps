import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        env[parts[0].trim()] = parts.slice(1).join('=').trim();
    }
});

const url = env['VITE_SUPABASE_URL'] + '/rest/v1/cashbook?limit=1';
const key = env['VITE_SUPABASE_ANON_KEY'];

fetch(url, {
    method: 'GET',
    headers: {
        'apikey': key,
        'Authorization': 'Bearer ' + key
    }
}).then(res => res.json()).then(data => {
    if (data && data.length > 0) {
        console.log("Columns:", Object.keys(data[0]));
    } else {
        console.log("Empty table, inserting minimal to get error...");
        return fetch(url, {
            method: 'POST',
            headers: {
                'apikey': key,
                'Authorization': 'Bearer ' + key,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({ type: 'income', amount: 1000 })
        }).then(res => res.text()).then(txt => console.log(txt));
    }
}).catch(e => console.error(e));
