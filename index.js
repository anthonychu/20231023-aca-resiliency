const server = require('fastify')({logger: true});
const path = require('node:path');
const fastifyIO = require("fastify-socket.io");

server.register(fastifyIO);

server.register(require('@fastify/static'), {
  root: path.join(__dirname, 'public'),
});  

const status = {
  injectFaults: false,
};

server.get('/status', async (request, reply) => {
  return status;
});

server.post('/status', async (request, reply) => {
  const { injectFaults } = request.body;
  status.injectFaults = injectFaults;
  return status;
});

let requestCounter = 0;
server.get('/time', async (request, reply) => {
  const baseMessage = {
    path: request.url,
    method: request.method,
  };

  if (requestCounter++ % 3 !== 0 && status.injectFaults) {
    server.io.emit('request', { ...baseMessage, status: 'Failed' });
    throw new Error('Injected fault');
  }

  const time = new Date();
  server.io.emit('request', { ...baseMessage, status: 'Success' });
  return { time };
});

server.listen({ port: 3000, host: '0.0.0.0' }, (err, address) => {
  if (err) throw err;
});