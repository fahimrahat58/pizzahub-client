import { betterAuth } from "better-auth";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { jwt } from "better-auth/plugins";
import { db } from "@/lib/mongodb";

const authURL = process.env.BETTER_AUTH_URL;

if (!authURL) {
  throw new Error("BETTER_AUTH_URL is missing");
}

const frontendURL = process.env.FRONTEND_URL ?? authURL;
const isSecure = authURL.startsWith("https://");

const googleProvider =
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        },
      }
    : {};

export const auth = betterAuth({
  appName: "PizzaHub",

  baseURL: authURL,

  secret: process.env.BETTER_AUTH_SECRET,

  database: mongodbAdapter(db),

  trustedOrigins: [authURL, frontendURL],

  useSecureCookies: isSecure,
  defaultCookieAttributes: {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecure,
    path: "/",
  },

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },

  socialProviders: googleProvider,

  user: {
    // Better Auth user collection will be "users"
    modelName: "users",

    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "customer",

        // The signup form may request a role, but the database hook below
        // whitelists it. Admin is never assignable from the client.
        input: true,
      },

      isBlocked: {
        type: "boolean",
        required: false,
        defaultValue: false,

        // Users cannot change their blocked status
        input: false,
      },

      businessName: {
        type: "string",
        required: false,

        // Vendor can update business name
        input: true,
      },

      subscriptionPlan: {
        type: "string",
        required: false,
        defaultValue: "free",

        // Users cannot change subscription
        input: false,
      },

      subscriptionExpiresAt: {
        type: "date",
        required: false,

        // Users cannot change subscription expiry
        input: false,
      },

      subscriptionStatus: {
        type: "string",
        required: false,
        input: false,
      },

      stripeCustomerId: {
        type: "string",
        required: false,
        input: false,
      },

      stripeSubscriptionId: {
        type: "string",
        required: false,
        input: false,
      },

      cancelAtPeriodEnd: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false,
      },
    },
  },

  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const requestedRole = (
            user as typeof user & {
              role?: string;
            }
          ).role;

          return {
            data: {
              ...user,

              // Only vendor or customer can be assigned here.
              // Admin must be assigned through a protected
              // server-side operation.
              role: requestedRole === "vendor" ? "vendor" : "customer",

              isBlocked: false,
              subscriptionPlan: "free",
            },
          };
        },
      },

      update: {
        before: async (user) => {
          if (
            "role" in user ||
            "isBlocked" in user ||
            "subscriptionPlan" in user ||
            "subscriptionStatus" in user ||
            "stripeCustomerId" in user ||
            "stripeSubscriptionId" in user ||
            "subscriptionExpiresAt" in user ||
            "cancelAtPeriodEnd" in user
          ) {
            return false;
          }

          return {
            data: user,
          };
        },
      },
    },
  },

  plugins: [
    jwt({
      jwt: {
        issuer: authURL,
        audience: authURL,
        expirationTime: "15m",
        // Lets the API reject tokens whose Better Auth session was revoked.
        definePayload: ({ session }) => ({ sessionId: session.id }),
      },
    }),
  ],
});
