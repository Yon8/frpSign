/**
 * 项目名称：frpSign
 * cron 0 9 8 * * *  frpSign.js
 * 支持2.0.x版本的panel
 * ========= 青龙--配置文件 ===========
 * # 项目名称
 * 变量名 FRP_URL FRP_USERNAME  FRP_PASSWORD
 * 变量值 https://xxxx.com(不带/) 账号 密码
 * const $ = new Env("frpSign");
 * ====================================
 *
 */
const axios = require('axios');

const { JSDOM } = require('jsdom');

let url =process.env.FRP_URL;
let username=process.env.FRP_USERNAME;
let password=process.env.FRP_PASSWORD;
let cookie = '';
async function sign(){
  const loginHeaders = {

    'Cache-Control': 'max-age=0',
    'Upgrade-Insecure-Requests': '1',
    Origin: url,
    'Content-Type': 'application/x-www-form-urlencoded',
    'User-Agent': 'Mozilla/5.0 (Linux; Android 12; Redmi K30 Pro Build/SKQ1.211006.001) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/96.0.4664.104 Mobile Safari/537.36',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-User': '?1',
    'Sec-Fetch-Dest': 'document',
    Referer: `${url}/?page=login`,
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
  };

  const data = `g-recaptcha-response=&username=${username}&password=${password}`;

  await axios.post(`${url}/?action=login&page=login`, data, { headers:loginHeaders })
      .then((response) => {
        // 获取响应头中的 Set-Cookie 字段
        const setCookie = response.headers['set-cookie'];
        if (setCookie) {
          console.log('Cookie:');
          console.log(setCookie);
          cookie = setCookie;
        } else {
          console.log('没有收到Cookie');
        }
      })
      .catch((error) => {
        console.error('Error1:', error.message);
      });

  const crsfHeaders = {
    'Upgrade-Insecure-Requests': '1',
    'User-Agent': 'Mozilla/5.0 (Linux; Android 12; Redmi K30 Pro Build/SKQ1.211006.001) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/96.0.4664.104 Mobile Safari/537.36',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-User': '?1',
    'Sec-Fetch-Dest': 'document',
    Referer: `${url}/?page=panel`,
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
    Cookie: cookie,
  };
  let csrfToken = null;
  await axios.get(`${url}/?page=panel&module=sign`,{headers:crsfHeaders})
      .then((response) => {
        const dom = new JSDOM(response.data);
        const scriptElements = dom.window.document.querySelectorAll('script[type="text/javascript"]');

        scriptElements.forEach(script => {
          const matches = script.textContent.match(/var\s+csrf_token\s*=\s*"(.*?)"/);
          if (matches && matches[1]) {
            csrfToken = matches[1];
          }
        });
        // 检查 CSRF 令牌的值是否为空
        if (csrfToken === null) {
          console.error('未找到 CSRF 令牌值，退出程序...');
          process.exit(1); // 使用 1 作为退出代码表示有错误发生
        } else {
          console.log('CSRF 令牌的值是:', csrfToken);
        }
      })
      .catch((error) => {
        console.error('Error2:', error.message);
      });

  const signHeaders = {
    'accept': '*/*',
    'user-agent': 'Mozilla/5.0 (Linux; Android 12; Redmi K30 Pro Build/SKQ1.211006.001) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/96.0.4664.104 Mobile Safari/537.36',
    'x-requested-with': 'XMLHttpRequest',
    'sec-fetch-site': 'same-origin',
    'sec-fetch-mode': 'cors',
    'sec-fetch-dest': 'empty',
    referer: `${url}/?page=panel&module=sign`,
    'accept-encoding': 'gzip, deflate, br',
    'accept-language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
    cookie: cookie,
  };

  await axios.get(`${url}/?page=panel&module=sign&sign=&csrf=${csrfToken}`, { headers:signHeaders })
      .then(response => {
        console.log('签到结果:', response.data);
      })
      .catch(error => {
        console.error('Error:', error);
      });
}
sign();
