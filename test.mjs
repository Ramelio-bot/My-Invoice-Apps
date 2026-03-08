import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        env[parts[0].trim()] = parts.slice(1).join('=').trim();
    }
});

const url = env['VITE_SUPABASE_URL'] + '/rest/v1/cashbook?select=notes,receipt_url&limit=1';
const key = env['VITE_SUPABASE_ANON_KEY'];

console.log("Fetching: " + url);

fetch(url, {
    method: 'GET',
    headers: {
        'apikey': key,
        'Authorization': 'Bearer ' + key
    }
}).then(res => res.text()).then(txt => {
    console.log("GET notes,receipt_url:", txt);
}).catch(e => console.error(e));

const url2 = env['VITE_SUPABASE_URL'] + '/rest/v1/cashbook?select=description,bukti&limit=1';

fetch(url2, {
    method: 'GET',
    headers: {
        'apikey': key,
        'Authorization': 'Bearer ' + key
    }
}).then(res => res.text()).then(txt => {
    console.log("GET description,bukti:", txt);
}).catch(e => console.error(e));

const url3 = env['VITE_SUPABASE_URL'] + '/rest/v1/cashbook';
fetch(url3, {
    method: 'POST',
    headers: {
        'apikey': key,
        'Authorization': 'Bearer ' + key,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    },
    body: JSON.stringify({
        type: 'income',
        amount: 1000,
        category: 'test',
        notes: 'test note',
        date: '2026-03-08',
        reference_type: 'manual'
    })
}).then(res => {
    console.log("POST status:", res.status);
    return res.text();
}).then(txt => {
    console.log("POST response:", txt);
}).catch(e => console.error(e));
