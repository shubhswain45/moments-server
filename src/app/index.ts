import express, { Response, Request } from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import bodyParser from 'body-parser'; // Body parser for JSON handling
import cors from 'cors';

export async function initServer() {
    const app = express();

    // CORS configuration
    const corsOptions = {
        origin: ['http://localhost:3000'],
        credentials: true,
    };

    // Use CORS middleware
    app.use(cors(corsOptions));

    // Increase the limit for JSON payload
    app.use(bodyParser.json({ limit: '10mb' })); // Increase to 10 MB or another limit you prefer

    const graphqlServer = new ApolloServer({
        typeDefs: `
            type Query {
                sayHello: String
            }
        `,
        resolvers: {
            Query: {
                sayHello: () => "Hello"
            },
        },
    });

    await graphqlServer.start();

    
    // Middleware for handling GraphQL requests
    app.use("/graphql", expressMiddleware(graphqlServer));

    return app;
}
