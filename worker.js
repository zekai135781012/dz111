addEventListener('fetch', function(event) {
  event.respondWith(handleRequest(event.request, event.env));
});

async function handleRequest(request, env) {
  var cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: cors });
  }
  var url = new URL(request.url);
  if (url.pathname !== '/api/farm/latest') {
    return jr({ success: false, error: 'Not Found' }, 404);
  }
  try {
    var roleId = env.FARM_ROLE_ID;
    var deviceModel = env.FARM_DEVICE_MODEL;
    var uuid = env.FARM_UUID;
    var token = env.FARM_TOKEN || 'aU0ZcOzmpNoa56fDez';
    if (!roleId || !deviceModel || !uuid) {
      return jr({ success: false, error: '配置不完整' }, 500);
    }
    var auth = ga(roleId, token);
    var body = JSON.stringify({
      server: '15001', code: 'u5', sign: auth.sign,
      language: 'zh-CN', deviceName: 'duchamp', systemVersion: 36,
      uuid: uuid, mode: 'view', systemName: 'android',
      batteryState: 3, extra: '', appId: '4608997350',
      batteryLevel: 90, gameId: 'u5', roleId: roleId,
      deeplink: '[]', env: 'production', nonce: auth.nonce,
      size: 'medium', domain: 'https://u5-vision.nie.netease.com',
      designId: 4608997351, sdkVersion: 3, deviceModel: deviceModel,
      ts: auth.ts, nightMode: false
    });
    var resp = await fetch('https://u5-vision.nie.netease.com/widget/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body
    });
    var json = await resp.json();
    if (json.success !== 'true') {
      return jr({ success: false, error: json.desc || '失败' }, 500);
    }
    var el = json.data && json.data.view && json.data.view.elements ? json.data.view.elements : {};
    var wi = [];
    if (el['image_R3Xw:R5xp'] && el['image_R3Xw:R5xp'].src) wi.push(el['image_R3Xw:R5xp'].src);
    if (el['image_JeHp:Vmcb'] && el['image_JeHp:Vmcb'].src) wi.push(el['image_JeHp:Vmcb'].src);
    return jr({
      success: true,
      data: {
        weatherIcons: wi,
        seedImage: gs(el, 'image_Lb2J:5Fo7'),
        seedName: gt(el, 'text_TLl5:dwdi'),
        seedQualityBg: gs(el, 'image_z9Sa:fdFU'),
        toolImage: gs(el, 'image_cruF:gFs5'),
        toolName: gt(el, 'text_vtOZ:50mh'),
        toolQualityBg: gs(el, 'image_6grb:EYVa'),
        fetchTime: Date.now()
      },
      maskedRoleId: roleId.substring(0, 3) + '***',
      maskedDeviceModel: '***',
      maskedUuid: uuid.substring(0, 4) + '***'
    });
  } catch (e) {
    return jr({ success: false, error: e.message }, 500);
  }
}

function gs(o, k) { return o[k] && o[k].src ? o[k].src : ''; }
function gt(o, k) { return o[k] && o[k].content ? o[k].content : ''; }
function jr(d, s) {
  return new Response(JSON.stringify(d), {
    status: s || 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
}

function ga(roleId, token) {
  var ts = Date.now();
  var chars = '0123456789abcdefghijklmnopqrstuvwxyz';
  var nonce = '';
  for (var i = 0; i < 18; i++) nonce += chars.charAt(Math.floor(Math.random() * 36));
  var now = new Date(ts + 28800000);
  var ds = now.getUTCFullYear() + '' + String(now.getUTCMonth() + 1).padStart(2, '0') + '' + String(now.getUTCDate()).padStart(2, '0');
  var dt = md5('code=u5&date=' + ds + '&token=' + token);
  return { sign: md5('code=u5&roleId=' + roleId + '&nonce=' + nonce + '&ts=' + ts + '&token=' + dt), nonce: nonce, ts: ts };
}

function md5(s) {
  function L(k, d) { return (k << d) | (k >>> (32 - d)); }
  function K(G, k) { var I, d, F, H, x; F = (G & 2147483648); H = (k & 2147483648); I = (G & 1073741824); d = (k & 1073741824); x = (G & 1073741823) + (k & 1073741823); if (I & d) return (x ^ 2147483648 ^ F ^ H); if (I | d) { if (x & 1073741824) return (x ^ 3221225472 ^ F ^ H); else return (x ^ 1073741824 ^ F ^ H); } else return (x ^ F ^ H); }
  function r(d, F, G) { return (d & F) | ((~d) & G); }
  function q(d, F, G) { return (d & G) | (F & (~G)); }
  function p(d, F, G) { return (d ^ F ^ G); }
  function n(d, F, G) { return (F ^ (d | (~G))); }
  function u(G, F, aa, Z, k, H, I) { G = K(G, K(K(r(F, aa, Z), k), I)); return K(L(G, H), F); }
  function f(G, F, aa, Z, k, H, I) { G = K(G, K(K(q(F, aa, Z), k), I)); return K(L(G, H), F); }
  function D(G, F, aa, Z, k, H, I) { G = K(G, K(K(p(F, aa, Z), k), I)); return K(L(G, H), F); }
  function t(G, F, aa, Z, k, H, I) { G = K(G, K(K(n(F, aa, Z), k), I)); return K(L(G, H), F); }
  function e(G) { var Z; var F = G.length; var x = F + 8; var k = (x - (x % 64)) / 64; var I = (k + 1) * 16; var aa = Array(I - 1); var d = 0; var H = 0; while (H < F) { Z = (H - (H % 4)) / 4; d = (H % 4) * 8; aa[Z] = (aa[Z] | (G.charCodeAt(H) << d)); H++; } Z = (H - (H % 4)) / 4; d = (H % 4) * 8; aa[Z] = aa[Z] | (128 << d); aa[I - 2] = F << 3; aa[I - 1] = F >>> 29; return aa; }
  function B(x) { var k = "", F = "", G, d; for (d = 0; d <= 3; d++) { G = (x >>> (d * 8)) & 255; F = "0" + G.toString(16); k = k + F.substr(F.length - 2, 2); } return k; }
  var C = []; var P, h, E, v, g, Y, X, W, V; var S = 7, Q = 12, N = 17, M = 22; var A = 5, z = 9, y = 14, w = 20; var o = 4, m = 11, l = 16, j = 23; var U = 6, T = 10, R = 15, O = 21;
  s = utf8Encode(s); C = e(s); Y = 1732584193; X = 4023233417; W = 2562383102; V = 271733878;
  for (P = 0; P < C.length; P += 16) { h = Y; E = X; g = W; v = V; Y = u(Y, X, W, V, C[P + 0], S, 3614090360); V = u(V, Y, X, W, C[P + 1], Q, 3905402710); W = u(W, V, Y, X, C[P + 2], N, 606105819); X = u(X, W, V, Y, C[P + 3], M, 3250441966); Y = u(Y, X, W, V, C[P + 4], S, 4118548399); V = u(V, Y, X, W, C[P + 5], Q, 1200080426); W = u(W, V, Y, X, C[P + 6], N, 2821735955); X = u(X, W, V, Y, C[P + 7], M, 4249261313); Y = u(Y, X, W, V, C[P + 8], S, 1770035416); V = u(V, Y, X, W, C[P + 9], Q, 2336552879); W = u(W, V, Y, X, C[P + 10], N, 4294925233); X = u(X, W, V, Y, C[P + 11], M, 2304563134); Y = u(Y, X, W, V, C[P + 12], S, 1804603682); V = u(V, Y, X, W, C[P + 13], Q, 4254626195); W = u(W, V, Y, X, C[P + 14], N, 2792965006); X = u(X, W, V, Y, C[P + 15], M, 1236535329); Y = f(Y, X, W, V, C[P + 1], A, 4129170786); V = f(V, Y, X, W, C[P + 6], z, 3225465664); W = f(W, V, Y, X, C[P + 11], y, 643717713); X = f(X, W, V, Y, C[P + 0], w, 3921069994); Y = f(Y, X, W, V, C[P + 5], A, 3593408605); V = f(V, Y, X, W, C[P + 10], z, 38016083); W = f(W, V, Y, X, C[P + 15], y, 3634488961); X = f(X, W, V, Y, C[P + 4], w, 3889429448); Y = f(Y, X, W, V, C[P + 9], A, 568446438); V = f(V, Y, X, W, C[P + 14], z, 3275163606); W = f(W, V, Y, X, C[P + 3], y, 4107603335); X = f(X, W, V, Y, C[P + 8], w, 1163531501); Y = f(Y, X, W, V, C[P + 13], A, 2850285829); V = f(V, Y, X, W, C[P + 2], z, 4243563512); W = f(W, V, Y, X, C[P + 7], y, 1735328473); X = f(X, W, V, Y, C[P + 12], w, 2368359562); Y = D(Y, X, W, V, C[P + 5], o, 4294588738); V = D(V, Y, X, W, C[P + 8], m, 2272392833); W = D(W, V, Y, X, C[P + 11], l, 1839030562); X = D(X, W, V, Y, C[P + 14], j, 4259657740); Y = D(Y, X, W, V, C[P + 1], o, 2763975236); V = D(V, Y, X, W, C[P + 4], m, 1272893353); W = D(W, V, Y, X, C[P + 7], l, 4139469664); X = D(X, W, V, Y, C[P + 10], j, 3200236656); Y = D(Y, X, W, V, C[P + 13], o, 681279174); V = D(V, Y, X, W, C[P + 0], m, 3936430074); W = D(W, V, Y, X, C[P + 3], l, 3572445317); X = D(X, W, V, Y, C[P + 6], j, 76029189); Y = D(Y, X, W, V, C[P + 9], o, 3654602809); V = D(V, Y, X, W, C[P + 12], m, 3873151461); W = D(W, V, Y, X, C[P + 15], l, 530742520); X = D(X, W, V, Y, C[P + 2], j, 3299628645); Y = t(Y, X, W, V, C[P + 0], U, 4096336452); V = t(V, Y, X, W, C[P + 7], T, 1126891415); W = t(W, V, Y, X, C[P + 14], R, 2878612391); X = t(X, W, V, Y, C[P + 5], O, 4237533241); Y = t(Y, X, W, V, C[P + 12], U, 1700485571); V = t(V, Y, X, W, C[P + 3], T, 2399980690); W = t(W, V, Y, X, C[P + 10], R, 4293915773); X = t(X, W, V, Y, C[P + 1], O, 2240044497); Y = t(Y, X, W, V, C[P + 8], U, 1873313359); V = t(V, Y, X, W, C[P + 15], T, 4264355552); W = t(W, V, Y, X, C[P + 6], R, 2734768916); X = t(X, W, V, Y, C[P + 13], O, 1309151649); Y = t(Y, X, W, V, C[P + 4], U, 4149444226); V = t(V, Y, X, W, C[P + 11], T, 3174756917); W = t(W, V, Y, X, C[P + 2], R, 718787259); X = t(X, W, V, Y, C[P + 9], O, 3951481745); Y = K(Y, h); X = K(X, E); W = K(W, g); V = K(V, v); }
  return (B(Y) + B(X) + B(W) + B(V)).toLowerCase();
}

function utf8Encode(str) {
  str = str.replace(/\r\n/g, "\n");
  var utftext = "";
  for (var n = 0; n < str.length; n++) {
    var c = str.charCodeAt(n);
    if (c < 128) {
      utftext += String.fromCharCode(c);
    } else if (c > 127 && c < 2048) {
      utftext += String.fromCharCode((c >> 6) | 192);
      utftext += String.fromCharCode((c & 63) | 128);
    } else {
      utftext += String.fromCharCode((c >> 12) | 224);
      utftext += String.fromCharCode(((c >> 6) & 63) | 128);
      utftext += String.fromCharCode((c & 63) | 128);
    }
  }
  return utftext;
}