import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters."),
  name: z.string().min(1).max(120).optional(),
  school: z.string().max(160).optional(),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const email = parsed.data.email.trim().toLowerCase();
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const userCount = await prisma.user.count();
    const role = userCount === 0 ? "ADMIN" : "STUDENT";

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);

    await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: parsed.data.name,
        school: parsed.data.school,
        role,
      },
    });

    return NextResponse.json({ ok: true, role });
  } catch {
    return NextResponse.json({ error: "Registration failed." }, { status: 500 });
  }
}
