import { ApolloServer } from "apollo-server-express";
import compression from "compression";
import express, { Application } from "express";
import { GraphQLSchema } from "graphql";
import { createServer, Server } from "http";
import { ApolloServerPluginDrainHttpServer } from "apollo-server-core";
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import Database from "./config/database";
import environments from "./config/environments";

class GraphQLServer {
  // Propiedades
  private app!: Application;
  private httpServer!: Server;
  private readonly DEFAULT_PORT = 3027;
  private schema!: GraphQLSchema;
  private database!: Database;
  constructor(schema: GraphQLSchema) {
    if (schema === undefined) {
      throw new Error(
        "Necesitamos un schema de GraphQL para trabajar con APIs GraphQL"
      );
    }
    this.schema = schema;
    if (process.env.NODE_ENV !== "production") {
      const envs = environments;
      console.log(envs);
    }
    this.init();
  }

  private init() {
    this.configExpress();
    this.initializeDb();
    this.configApolloServerExpress();
    // this.configRoutes();
  }

  private async initializeDb() {
    this.database = new Database();
  }

  private configExpress() {
    this.app = express();

    this.app.use(compression());

    this.httpServer = createServer(this.app);
  }
  private getDynamicContext = async (ctx: any) => {
    // ctx is the graphql-ws Context where connectionParams live
    // Otherwise let our resolvers know we don't have a current user
    const context =  async () => {
      return {
        db: await this.database.init()
      };
    };
    return context;
  };
  private async configApolloServerExpress() {
    const db = await this.database.init();
    
    // Create our WebSocket server using the HTTP server we just set up.
    const wsServer = new WebSocketServer({
      server: this.httpServer,
      path: '/graphql',
    });
    // Save the returned server's info so we can shutdown this server later
    const serverCleanup = useServer({
      schema: this.schema,
      context: (ctx) => {
        // You can define your own function for setting a dynamic context
        // or provide a static value
       return this.getDynamicContext(ctx);
     },
      // As before, ctx is the graphql-ws Context where connectionParams live.
      onConnect: async () => {
        // Check authentication every time a client connects.
        console.log('connect');
      },
      onDisconnect(ctx, code, reason) {
        console.log('Disconnected!');
      },
    }, wsServer);

    // Set up ApolloServer.
    const server = new ApolloServer({
      schema: this.schema,
      csrfPrevention: true,
      cache: "bounded",
      introspection: true,
      context: async () => {
        return {
          db
        };
      },
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
