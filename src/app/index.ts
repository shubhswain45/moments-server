import express, { Response, Request } from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import bodyParser from 'body-parser'; // Body parser for JSON handling
import cors from 'cors';
import JWTService from './services/JWTService';
import cookieParser from 'cookie-parser';
import { Auth } from './auth';

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

    app.use(cookieParser())

    const graphqlServer = new ApolloServer({
        typeDefs: `
            ${Auth.types}

            type Query {
                sayHello: String
            }

            type Mutation {
                ${Auth.mutations}
            }
        `,
        resolvers: {
            Query: {
                sayHello: () => "Hello"
            },
            Mutation: {
                ...Auth.resolvers.mutations
            }
        },
    });

    await graphqlServer.start();

    
    // Middleware for handling GraphQL requests
    app.use("/graphql", expressMiddleware(graphqlServer, {
        context: async ({ req, res }: { req: Request, res: Response }) => {
            let token;
    
            // First, check if the token is in the Authorization header
            if (req.headers.authorization) {
                // Extract the token from the Authorization header
                token = req.headers.authorization.split("Bearer ")[1];
            }
    
            // If the token isn't in the Authorization header, check if it's in cookies
            if (!token && req.cookies["__Moments_token"]) {
                token = req.cookies["__Moments_token"];
            }
    
            // Decode the token if available
            let user;
            if (token) {
                user = JWTService.decodeToken(token);
            }
    
            // Return the context with the decoded user
            return {
                user,
                req,
                res
            };
        }
    }));

    return app;
}
