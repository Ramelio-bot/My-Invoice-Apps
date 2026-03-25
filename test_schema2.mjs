import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        env[parts[0].trim()] = parts.slice(1).join('=').trim();
    }
});

const url = env['VITE_SUPABASE_URL'] + '/rest/v1/?apikey=' + env['VITE_SUPABASE_ANON_KEY'];
const key = env['VITE_SUPABASE_ANON_KEY'];

fetch(url, {
    method: 'GET',
    headers: {
        'Authorization': 'Bearer ' + key
    }
}).then(res => res.json()).then(data => {
    const cb = data.definitions['cashbook'];
    console.log("cashbook props:", cb ? Object.keys(cb.properties) : "not found");

    const ks = data.definitions['kasir_shifts'];
    console.log("kasir_shifts props:", ks ? Object.keys(ks.properties) : "not found");
}).catch(e => console.error(e));
