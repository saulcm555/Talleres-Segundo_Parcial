const readline = require('readline');
const http = require('http');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '👤> '
});

console.log('Escribe tu mensaje para Gemini (Ctrl+C para salir):');
rl.prompt();

rl.on('line', (line) => {
  const data = JSON.stringify({ message: line.trim() });
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/procesar',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
      try {
        const json = JSON.parse(body);
        console.log('\n🤖>', json.response, '\n');
      } catch (e) {
        console.log('\n🤖> Error en la respuesta\n');
      }
      rl.prompt();
    });
  });

  req.on('error', (e) => {
    console.error(`\n🤖> Error: ${e.message}\n`);
    rl.prompt();
  });

  req.write(data);
  req.end();
});
