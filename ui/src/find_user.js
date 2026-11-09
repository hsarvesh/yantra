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

async function run() {
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
  
  const navRes = await fetch(`${SNOW_URL}/navpage.do`, {
    headers: { 'Cookie': cookieStr }
  });
  const navText = await navRes.text();
  const match = navText.match(/g_ck\s*=\s*['"]([a-f0-9]+)['"]/i);
  const token = match ? match[1] : '';
  
  const userRes = await fetch(`${SNOW_URL}/api/now/table/sys_user?sysparm_query=user_name=ChaR^ORnameLIKEChandramohan&sysparm_fields=user_name,name,first_name,last_name,email,title,manager.name,active`, {
    headers: { 'Cookie': cookieStr, 'X-UserToken': token, 'Accept': 'application/json' }
  });
  const data = await userRes.json();
  console.log(JSON.stringify(data.result, null, 2));
}
run();
