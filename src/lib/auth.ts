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
    // Better Auth user collection will be "users"
    modelName: "users",

    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "customer",

        // Users cannot change their role through profile update
        input: false,
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
            "subscriptionExpiresAt" in user
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
      },
    }),
  ],
});
