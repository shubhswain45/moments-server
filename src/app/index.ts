import express, { Response, Request } from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import bodyParser from 'body-parser'; // Body parser for JSON handling
import cors from 'cors';
import JWTService from './services/JWTService';
import cookieParser from 'cookie-parser';
import { Auth } from './auth';
import { Post } from './post';
import dotenv from 'dotenv'

export async function initServer() {
    const app = express();

    // CORS configuration
    const corsOptions = {
        origin: ['https://moments-client.vercel.app'],
        credentials: true,
    };

    // Use CORS middleware
    app.use(cors(corsOptions));

    // Increase the limit for JSON payload
    app.use(bodyParser.json({ limit: '10mb' })); // Increase to 10 MB or another limit you prefer

    app.use(cookieParser())

    dotenv.config()

    const graphqlServer = new ApolloServer({
        typeDefs: `
            ${Auth.types}
            ${Post.types}
    
            type Query {
                ${Auth.queries}
                ${Post.queries}
            }
    
            type Mutation {
                ${Auth.mutations}
                ${Post.mutations}
            }
        `,
        resolvers: {
            Query: {
                ...Auth.resolvers.queries,
                ...Post.resolvers.queries
            },
            Mutation: {
                ...Auth.resolvers.mutations,
                ...Post.resolvers.mutations,
            },
            ...Post.resolvers.extraResolvers
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
