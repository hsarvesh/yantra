import fs from 'fs';
import path from 'path';

// Load .env
if (typeof process.loadEnvFile === 'function') {
  for (const envPath of [path.join(process.cwd(), '.env'), path.join(process.cwd(), 'ui', '.env'), path.join(path.dirname(new URL(import.meta.url).pathname), '../.env')]) {
    try { if (fs.existsSync(envPath)) { process.loadEnvFile(envPath); break; } } catch (e) {}
  }
}

const SNOW_URL = (process.env.SNOW_INSTANCE_URL || '').replace(/\/+$/, '');
const SNOW_USER = process.env.SNOW_USERNAME || 'admin';
const SNOW_PASSWORD = process.env.SNOW_PASSWORD || '';

async function test() {
  const loginUrl = `${SNOW_URL}/login.do`;
  const params = new URLSearchParams({
    user_name: SNOW_USER,
    user_password: SNOW_PASSWORD,
    sys_action: 'sysverb_login'
  });
  
  const res = await fetch(loginUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
    redirect: 'manual'
  });
  
  const setCookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [res.headers.get('set-cookie')];
  const cookieStr = setCookies.map(c => c.split(';')[0]).join('; ');
  console.log('Login status:', res.status, 'Cookie count:', setCookies.length);
  
  // Get navpage for g_ck
  const navRes = await fetch(`${SNOW_URL}/navpage.do`, {
    headers: { 'Cookie': cookieStr }
  });
  const navText = await navRes.text();
  const match = navText.match(/g_ck\s*=\s*['"]([a-f0-9]+)['"]/i);
  if (!match) {
    console.log('g_ck not found');
    return;
  }
  const token = match[1];
  console.log('Got g_ck token:', token.substring(0, 10));
  
  // Query sc_req_item
  const listRes = await fetch(`${SNOW_URL}/api/now/table/sc_req_item?sysparm_limit=5&sysparm_fields=number,short_description,sys_id,sys_created_on,state`, {
    headers: { 'Cookie': cookieStr, 'X-UserToken': token, 'Accept': 'application/json' }
  });
  console.log('List status:', listRes.status);
  const data = await listRes.json();
  console.log('Results:', data.result);
}
test();
