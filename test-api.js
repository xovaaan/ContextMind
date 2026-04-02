const http = require('http');

function testEndpoint(path, name) {
  return new Promise((resolve) => {
    console.log(`\n\n--- Testing ${name} (${path}) ---`);
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET',
      headers: {
        'x-api-key': 'ctxmind_invalid000000000000000000'
      }
    }, (res) => {
      console.log(`STATUS: ${res.statusCode}`);
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        console.log(`BODY: ${body}`);
        resolve();
      });
    });

    req.on('error', (e) => {
      console.error(`problem with request: ${e.message}`);
      resolve();
    });

    req.end();
  });
}

async function runTests() {
  console.log('Ensure the dev server is running on localhost:3000');
  
  // Test v1 endpoint
  await testEndpoint('/api/v1/peers', 'V1 Endpoint');
  
  // Test legacy endpoint (should still work since we didn't delete the original files)
  await testEndpoint('/api/peers', 'Legacy Endpoint');
}

runTests();
