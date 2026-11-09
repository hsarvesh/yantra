async function test() {
  const loginUrl = 'https://dev364281.service-now.com/login.do';
  const params = new URLSearchParams({
    user_name: 'admin',
    user_password: 'nm6uC9vSG%$X',
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
  const navRes = await fetch('https://dev364281.service-now.com/navpage.do', {
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
  const listRes = await fetch('https://dev364281.service-now.com/api/now/table/sc_req_item?sysparm_limit=5&sysparm_fields=number,short_description,sys_id,sys_created_on,state', {
    headers: { 'Cookie': cookieStr, 'X-UserToken': token, 'Accept': 'application/json' }
  });
  console.log('List status:', listRes.status);
  const data = await listRes.json();
  console.log('Results:', data.result);
}
test();
