const http = require('http');

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/peers',
  method: 'GET',
  headers: {
    'x-api-key': 'ctxmind_invalid000000000000000000'
  }
}, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.on('data', (chunk) => {
    console.log(`BODY: ${chunk}`);
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.end();
