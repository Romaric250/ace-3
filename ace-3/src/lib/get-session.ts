import { cache } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

/** One session resolution per request (RSC / route handlers sharing this module). */
export const getSession = cache(async () => getServerSession(authOptions));
