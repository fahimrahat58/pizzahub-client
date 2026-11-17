import { betterAuth } from "better-auth";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { jwt } from "better-auth/plugins";
import { db } from "@/lib/mongodb";

const authURL = process.env.BETTER_AUTH_URL;

if (!authURL) {
  throw new Error("BETTER_AUTH_URL is missing");
}

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

  database: mongodbAdapter(db),

  trustedOrigins: ["http://localhost:3000"],

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
    maxPasswordLength: 128,
  },

  socialProviders: googleProvider,

  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "customer",
        input: true,
      },

      isBlocked: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false,
      },

      businessName: {
        type: "string",
        required: false,
        input: false,
      },

      subscriptionPlan: {
        type: "string",
        required: false,
        defaultValue: "free",
        input: false,
      },

      subscriptionExpiresAt: {
        type: "date",
        required: false,
        input: false,
      },
    },
  },

  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const requestedRole = (user as typeof user & { role?: string }).role;

          return {
            data: {
              ...user,
              role: requestedRole === "vendor" ? "vendor" : "customer",
              isBlocked: false,
              subscriptionPlan: "free",
            },
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
      },
    }),
  ],
});
