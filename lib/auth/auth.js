import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";

let authInstance = null;
const client = new MongoClient(process.env.MONGODB_AUTH_URI);
const db = client.db();

export const getAuth = async () => {
    if (authInstance) return authInstance;

    authInstance = betterAuth({
        secret: process.env.BETTER_AUTH_SECRET,
        baseURL: process.env.BETTER_AUTH_URL,
        emailAndPassword: {
            enabled: false
        },
        socialProviders: {
            google: {
                prompt: "select_account",
                clientId: process.env.OAUTH_GOOGLE_ID,
                clientSecret: process.env.OAUTH_GOOGLE_SECRET,
                scope: ["email"],
            }
        },
        hooks: {
            onError(error, ctx) {
                return ctx.redirect(`/auth/error?error=${error.code}`);
            },
        },
        database: mongodbAdapter(db, {
            client
        }),
    });

    return authInstance;
}

export const auth = await getAuth();
