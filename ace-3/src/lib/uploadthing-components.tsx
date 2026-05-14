"use client";

import { generateUploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

export const PastPaperUploadButton = generateUploadButton<OurFileRouter>({
  url: "/api/uploadthing",
});
