import Fastify from 'fastify';
import { setupWebSocket } from './socket';

const fastify = Fastify({ logger: true });

// Example REST route
fastify.get('/', async () => {
  return { status: 'API running' };
});

// Start server
const start = async () => {
  try {
    const server = await fastify.listen({ port: 4000, host: '0.0.0.0' });
    console.log(`Server running at ${server}`);
    setupWebSocket(fastify.server);

  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
