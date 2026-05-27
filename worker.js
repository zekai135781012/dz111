addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request, event.env));
});

async function handleRequest(request, env) {
  var corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  var url = new URL(request.url);
  if (url.pathname !== '/api/farm/latest') {
    return makeJson({ success: false, error: 'Not Found' }, 404);
  }

  try {
    var roleId = env.FARM_ROLE_ID;
    var deviceModel = env.FARM_DEVICE_MODEL;
    var uuid = env.FARM_UUID;
    var server = env.FARM_SERVER || '15001';
    var token = env.FARM_TOKEN || 'aU0ZcOzmpNoa56fDez';

    if (!roleId || !deviceModel || !uuid) {
      return makeJson({ success: false, error: '服务器配置不完整' }, 500);
    }

    var auth = generateAuth(roleId, token);

    var body = JSON.stringify({
      server: server,
      code: 'u5',
      sign: auth.sign,
      language: 'zh-CN',
      deviceName: 'duchamp',
      systemVersion: 36,
      uuid: uuid,
      mode: 'view',
      systemName: 'android',
      batteryState: 3,
      extra: '',
      appId: '4608997350',
      batteryLevel: 90,
      gameId: 'u5',
      roleId: roleId,
      deeplink: '[{"scheme":"ntes","host":"game.mobile","pathPrefix":"/party"}]',
      env: 'production',
      nonce: auth.nonce,
      size: 'medium',
      domain: 'https://u5-vision.nie.netease.com',
      designId: 4608997351,
      sdkVersion: 3,
      deviceModel: deviceModel,
      ts: auth.ts,
      nightMode: false
    });

    var resp = await fetch('https://u5-vision.nie.netease.com/widget/view', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Dalvik/2.1.0'
      },
      body: body
    });

    var json = await resp.json();

    if (json.success !== 'true') {
      return makeJson({ success: false, error: json.desc || '请求失败' }, 500);
    }

    var elements = {};
    if (json.data && json.data.view && json.data.view.elements) {
      elements = json.data.view.elements;
    }

    var weatherIcons = [];
    if (elements['image_R3Xw:R5xp'] && elements['image_R3Xw:R5xp'].src) {
      weatherIcons.push(elements['image_R3Xw:R5xp'].src);
    }
    if (elements['image_JeHp:Vmcb'] && elements['image_JeHp:Vmcb'].src) {
      weatherIcons.push(elements['image_JeHp:Vmcb'].src);
    }

    var farmData = {
      weatherIcons: weatherIcons,
      seedImage: safeGet(elements, 'image_Lb2J:5Fo7', 'src'),
      seedName: safeGet(elements, 'text_TLl5:dwdi', 'content'),
      seedQualityBg: safeGet(elements, 'image_z9Sa:fdFU', 'src'),
      toolImage: safeGet(elements, 'image_cruF:gFs5', 'src'),
      toolName: safeGet(elements, 'text_vtOZ:50mh', 'content'),
      toolQualityBg: safeGet(elements, 'image_6grb:EYVa', 'src'),
      fetchTime: Date.now()
    };

    return makeJson({
      success: true,
      data: farmData,
      maskedRoleId: roleId.substring(0, 3) + '***',
      maskedDeviceModel: '***',
      maskedUuid: uuid.substring(0, 4) + '***'
    });

  } catch (e) {
    return makeJson({ success: false, error: e.message }, 500);
  }
}

function safeGet(obj, key, field) {
  if (obj[key] && obj[key][field]) {
    return obj[key][field];
  }
  return '';
}

function makeJson(data, status) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

function md5(str) {
  var hc = '0123456789abcdef';
  function rh(n) {
    var j, s = '';
    for (j = 0; j < 4; j++) {
      s += hc.charAt((n >> (j * 8 + 4)) & 0x0F) + hc.charAt((n >> (j * 8)) & 0x0F);
    }
    return s;
  }
  function ad(x, y) {
    var l = (x & 0xFFFF) + (y & 0xFFFF);
    var m = (x >> 16) + (y >> 16) + (l >> 16);
    return (m << 16) | (l & 0xFFFF);
  }
  function rl(n, c) {
    return (n << c) | (n >>> (32 - c));
  }
  function cm(q, a, b, x, s, e) {
    return ad(rl(ad(ad(a, q), ad(x, e)), s), b);
  }
  function ff(a, b, c, d, x, s, e) {
    return cm((b & c) | ((~b) & d), a, b, x, s, e);
  }
  function gg(a, b, c, d, x, s, e) {
    return cm((b & d) | (c & (~d)), a, b, x, s, e);
  }
  function hh(a, b, c, d, x, s, e) {
    return cm(b ^ c ^ d, a, b, x, s, e);
  }
  function ii(a, b, c, d, x, s, e) {
    return cm(c ^ (b | (~d)), a, b, x, s, e);
  }
  var i;
  var nblk = ((str.length + 8) >> 6) + 1;
  var blks = new Array(nblk * 16);
  for (i = 0; i < nblk * 16; i++) blks[i] = 0;
  for (i = 0; i < str.length; i++) blks[i >> 2] |= str.charCodeAt(i) << ((i % 4) * 8);
  blks[i >> 2] |= 0x80 << ((i % 4) * 8);
  blks[nblk * 16 - 2] = str.length * 8;
  var a = 1732584193, b = -271733879, c = -1732584194, d = 271733878;
  var olda, oldb, oldc, oldd;
  for (i = 0; i < blks.length; i += 16) {
    olda = a; oldb = b; oldc = c; oldd = d;
    a = ff(a, b, c, d, blks[i+0], 7, -680876936); d = ff(d, a, b, c, blks[i+1], 12, -389564586);
    c = ff(c, d, a, b, blks[i+2], 17, 606105819); b = ff(b, c, d, a, blks[i+3], 22, -1044525330);
    a = ff(a, b, c, d, blks[i+4], 7, -176418897); d = ff(d, a, b, c, blks[i+5], 12, 1200080426);
    c = ff(c, d, a, b, blks[i+6], 17, -1473231341); b = ff(b, c, d, a, blks[i+7], 22, -45705983);
    a = ff(a, b, c, d, blks[i+8], 7, 1770035416); d = ff(d, a, b, c, blks[i+9], 12, -1958414417);
    c = ff(c, d, a, b, blks[i+10], 17, -42063); b = ff(b, c, d, a, blks[i+11], 22, -1990404162);
    a = ff(a, b, c, d, blks[i+12], 7, 1804603682); d = ff(d, a, b, c, blks[i+13], 12, -40341101);
    c = ff(c, d, a, b, blks[i+14], 17, -1502002290); b = ff(b, c, d, a, blks[i+15], 22, 1236535329);
    a = gg(a, b, c, d, blks[i+1], 5, -165796510); d = gg(d, a, b, c, blks[i+6], 9, -1069501632);
    c = gg(c, d, a, b, blks[i+11], 14, 643717713); b = gg(b, c, d, a, blks[i+0], 20, -373897302);
    a = gg(a, b, c, d, blks[i+5], 5, -701558691); d = gg(d, a, b, c, blks[i+10], 9, 38016083);
    c = gg(c, d, a, b, blks[i+15], 14, -660478335); b = gg(b, c, d, a, blks[i+4], 20, -405537848);
    a = gg(a, b, c, d, blks[i+9], 5, 568446438); d = gg(d, a, b, c, blks[i+14], 9, -1019803690);
    c = gg(c, d, a, b, blks[i+3], 14, -187363961); b = gg(b, c, d, a, blks[i+8], 20, 1163531501);
    a = gg(a, b, c, d, blks[i+13], 5, -1444681467); d = gg(d, a, b, c, blks[i+2], 9, -51403784);
    c = gg(c, d, a, b, blks[i+7], 14, 1735328473); b = gg(b, c, d, a, blks[i+12], 20, -1926607734);
    a = hh(a, b, c, d, blks[i+5], 4, -378558); d = hh(d, a, b, c, blks[i+8], 11, -2022574463);
    c = hh(c, d, a, b, blks[i+11], 16, 1839030562); b = hh(b, c, d, a, blks[i+14], 23, -35309556);
    a = hh(a, b, c, d, blks[i+1], 4, -1530992060); d = hh(d, a, b, c, blks[i+4], 11, 1272893353);
    c = hh(c, d, a, b, blks[i+7], 16, -155497632); b = hh(b, c, d, a, blks[i+10], 23, -1094730640);
    a = hh(a, b, c, d, blks[i+13], 4, 681279174); d = hh(d, a, b, c, blks[i+0], 11, -358537222);
    c = hh(c, d, a, b, blks[i+3], 16, -722521979); b = hh(b, c, d, a, blks[i+6], 23, 76029189);
    a = hh(a, b, c, d, blks[i+9], 4, -640364487); d = hh(d, a, b, c, blks[i+12], 11, -421815835);
    c = hh(c, d, a, b, blks[i+15], 16, 530742520); b = hh(b, c, d, a, blks[i+2], 23, -995338651);
    a = ii(a, b, c, d, blks[i+0], 6, -198630844); d = ii(d, a, b, c, blks[i+7], 10, 1126891415);
    c = ii(c, d, a, b, blks[i+14], 15, -1416354905); b = ii(b, c, d, a, blks[i+5], 21, -57434055);
    a = ii(a, b, c, d, blks[i+12], 6, 1700485571); d = ii(d, a, b, c, blks[i+3], 10, -1894986606);
    c = ii(c, d, a, b, blks[i+10], 15, -1051523); b = ii(b, c, d, a, blks[i+1], 21, -2054922799);
    a = ii(a, b, c, d, blks[i+8], 6, 1873313359); d = ii(d, a, b, c, blks[i+15], 10, -30611744);
    c = ii(c, d, a, b, blks[i+6], 15, -1560198380); b = ii(b, c, d, a, blks[i+13], 21, 1309151649);
    a = ii(a, b, c, d, blks[i+4], 6, -145523070); d = ii(d, a, b, c, blks[i+11], 10, -1120210379);
    c = ii(c, d, a, b, blks[i+2], 15, 718787259); b = ii(b, c, d, a, blks[i+9], 21, -343485551);
    a = ad(a, olda); b = ad(b, oldb); c = ad(c, oldc); d = ad(d, oldd);
  }
  return rh(a) + rh(b) + rh(c) + rh(d);
}

function generateAuth(roleId, token) {
  var ts = Date.now();
  var chars = '0123456789abcdefghijklmnopqrstuvwxyz';
  var nonce = '';
  for (var i = 0; i < 18; i++) {
    nonce += chars.charAt(Math.floor(Math.random() * 36));
  }
  var now = new Date(ts + 8 * 3600 * 1000);
  var y = now.getUTCFullYear();
  var m = String(now.getUTCMonth() + 1).padStart(2, '0');
  var d = String(now.getUTCDate()).padStart(2, '0');
  var dateStr = y + '' + m + '' + d;
  var dynamicToken = md5('code=u5&date=' + dateStr + '&token=' + token);
  var sign = md5('code=u5&roleId=' + roleId + '&nonce=' + nonce + '&ts=' + ts + '&token=' + dynamicToken);
  return { sign: sign, nonce: nonce, ts: ts };
}