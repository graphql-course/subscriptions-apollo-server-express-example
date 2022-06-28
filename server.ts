import { ApolloServer } from "apollo-server-express";
import compression from "compression";
import express, { Application } from "express";
import { execute, GraphQLSchema, subscribe } from "graphql";
import { createServer, Server } from "http";
import { ApolloServerPluginDrainHttpServer } from "apollo-server-core";
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';

class GraphQLServer {
  // Propiedades
  private app!: Application;
  private httpServer!: Server;
  private readonly DEFAULT_PORT = 3026;
  private schema!: GraphQLSchema;
  constructor(schema: GraphQLSchema) {
    if (schema === undefined) {
      throw new Error("Necesitamos un schema de GraphQL para trabajar con APIs GraphQL");
    }
    this.schema = schema;
    this.init();
  }

  private init() {
    this.configExpress();
    this.configApolloServerExpress();
    // this.configRoutes();
  }

  private configExpress() {
    this.app = express();

    this.app.use(compression());

    this.httpServer = createServer(this.app);
  }

  private async configApolloServerExpress() {

    // Create our WebSocket server using the HTTP server we just set up.
    const wsServer = new WebSocketServer({
      server: this.httpServer,
      path: '/graphql',
    });
    // Save the returned server's info so we can shutdown this server later
    const serverCleanup = useServer({ schema: this.schema }, wsServer);

    // Set up ApolloServer.
    const server = new ApolloServer({
      schema: this.schema,
      csrfPrevention: true,
      cache: "bounded",
      plugins: [
        // Proper shutdown for the HTTP server.
        ApolloServerPluginDrainHttpServer({ httpServer: this.httpServer }),

        // Proper shutdown for the WebSocket server.
        {
          async serverWillStart() {
            return {
              async drainServer() {
                await serverCleanup.dispose();
              },
            };
          },
        },
      ],
    });
    await server.start();
    server.applyMiddleware({ app: this.app, cors: true });


  }

  listen(callback: (port: number) => void): void {
    this.httpServer.listen(+this.DEFAULT_PORT, () => {
      callback(+this.DEFAULT_PORT);
    });
  }
}

export default GraphQLServer;