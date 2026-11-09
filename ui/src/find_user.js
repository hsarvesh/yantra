async function run() {
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
  
  const navRes = await fetch('https://dev364281.service-now.com/navpage.do', {
    headers: { 'Cookie': cookieStr }
  });
  const navText = await navRes.text();
  const match = navText.match(/g_ck\s*=\s*['"]([a-f0-9]+)['"]/i);
  const token = match ? match[1] : '';
  
  const userRes = await fetch('https://dev364281.service-now.com/api/now/table/sys_user?sysparm_query=user_name=ChaR^ORnameLIKEChandramohan&sysparm_fields=user_name,name,first_name,last_name,email,title,manager.name,active', {
    headers: { 'Cookie': cookieStr, 'X-UserToken': token, 'Accept': 'application/json' }
  });
  const data = await userRes.json();
  console.log(JSON.stringify(data.result, null, 2));
}
run();
