import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/auth-api";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  excerpt: z.string().max(2000).optional(),
  description: z.string().max(20000).optional(),
  imageUrl: z.string().max(2000).optional(),
  category: z.string().max(200).optional(),
  order: z.number().int().optional(),
  published: z.boolean().optional(),
});

export async function GET(req: Request) {
  const admin = await isAdminRequest();
  const { searchParams } = new URL(req.url);
  const all = searchParams.get("all") === "1";
  const list = await prisma.project.findMany({
    where: admin && all ? {} : { published: true },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(list);
}

export async function POST(req: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;
  const created = await prisma.project.create({
    data: {
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt ?? "",
      description: data.description ?? "",
      imageUrl: data.imageUrl ?? "",
      category: data.category ?? "",
      order: data.order ?? 0,
      published: data.published ?? false,
    },
  });
  return NextResponse.json(created);
}
