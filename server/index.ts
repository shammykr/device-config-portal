import { createServer } from 'node:http';
import { createPubSub, createSchema, createYoga } from 'graphql-yoga';
import { createResolvers, type Channels } from './resolvers.js';
import { typeDefs } from './schema.js';
import { startSimulator } from './simulator.js';

const pubsub = createPubSub<Channels>();

const yoga = createYoga({
  schema: createSchema({ typeDefs, resolvers: createResolvers(pubsub) }),
  graphqlEndpoint: '/graphql',
  // Subscriptions are served over Server-Sent Events (yoga's default transport).
});

startSimulator((events) => pubsub.publish('device:status', events));

const port = Number(process.env.PORT ?? 4000);
createServer(yoga).listen(port, () => {
  console.log(`Mock GraphQL API ready at http://localhost:${port}/graphql`);
});
