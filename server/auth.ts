import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { authStorage } from "./replit_integrations/auth/storage";
import type { User } from "@shared/schema";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET || "dev-secret-change-in-prod",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user: any, done) => done(null, user.id));

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await authStorage.getUser(id);
      done(null, user || false);
    } catch (err) {
      done(err);
    }
  });

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: `${process.env.BASE_URL || "http://localhost:5000"}/api/auth/google/callback`,
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            const user = await authStorage.upsertUser({
              id: `google_${profile.id}`,
              email: profile.emails?.[0]?.value ?? null,
              firstName: profile.name?.givenName ?? null,
              lastName: profile.name?.familyName ?? null,
              profileImageUrl: profile.photos?.[0]?.value ?? null,
            });
            done(null, user);
          } catch (err) {
            done(err as Error);
          }
        }
      )
    );
  }

  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    passport.use(
      new GitHubStrategy(
        {
          clientID: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET,
          callbackURL: `${process.env.BASE_URL || "http://localhost:5000"}/api/auth/github/callback`,
          scope: ["user:email"],
        },
        async (_accessToken: string, _refreshToken: string, profile: any, done: any) => {
          try {
            const displayName: string = profile.displayName || profile.username || "";
            const [firstName, ...rest] = displayName.split(" ");
            const user = await authStorage.upsertUser({
              id: `github_${profile.id}`,
              email: profile.emails?.[0]?.value ?? null,
              firstName: firstName || null,
              lastName: rest.join(" ") || null,
              profileImageUrl: profile.photos?.[0]?.value ?? null,
            });
            done(null, user);
          } catch (err) {
            done(err as Error);
          }
        }
      )
    );
  }
}

export function registerAuthRoutes(app: Express): void {
  // Google OAuth
  app.get("/api/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
  app.get(
    "/api/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/?auth=failed" }),
    (_req, res) => res.redirect("/")
  );

  // GitHub OAuth
  app.get("/api/auth/github", passport.authenticate("github", { scope: ["user:email"] }));
  app.get(
    "/api/auth/github/callback",
    passport.authenticate("github", { failureRedirect: "/?auth=failed" }),
    (_req, res) => res.redirect("/")
  );

  app.get("/api/logout", (req, res) => {
    req.logout(() => res.redirect("/"));
  });

  app.get("/api/auth/user", isAuthenticated, async (req, res) => {
    try {
      const user = await authStorage.getUser((req.user as User).id);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated() && req.user) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};
