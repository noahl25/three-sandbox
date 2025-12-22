import { betterAuth } from "better-auth";

let authInstance = null;

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
    });

    return authInstance;
}

export const auth = await getAuth();
