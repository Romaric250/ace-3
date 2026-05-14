import type { NextRequest } from "next/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { getToken } from "next-auth/jwt";

const f = createUploadthing();

export const ourFileRouter = {
  pastPaperAsset: f({
    pdf: { maxFileSize: "32MB", maxFileCount: 3 },
    image: { maxFileSize: "8MB", maxFileCount: 8 },
  })
    .middleware(async ({ req }) => {
      const secret = process.env.NEXTAUTH_SECRET;
      if (!secret) throw new UploadThingError("Server misconfigured.");
      const token = await getToken({ req: req as NextRequest, secret });
      if (!token?.sub || token.role !== "ADMIN") {
        throw new UploadThingError("Only administrators can upload reference files.");
      }
      return { userId: token.sub as string };
    })
    .onUploadComplete(async () => {
      return {};
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
