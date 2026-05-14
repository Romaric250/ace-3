import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: "ADMIN" | "STUDENT";
    };
  }

  interface User {
    role: "ADMIN" | "STUDENT";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "ADMIN" | "STUDENT";
  }
}
