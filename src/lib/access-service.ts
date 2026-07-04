import type { ClientAccessToken } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { AccessPurpose } from "@/lib/contract-types";

export type AccessTokenWithRelations = ClientAccessToken & {
  client: { id: string; name: string; email: string; company: string };
  project: {
    id: string;
    title: string;
    service: string;
    value: number;
    contractContent: unknown;
    contractStatus: string;
  };
};

export function isAccessTokenExpired(token: Pick<ClientAccessToken, "expiresAt">): boolean {
  return new Date() > token.expiresAt;
}

export function isAccessTokenUsed(token: Pick<ClientAccessToken, "usedAt">): boolean {
  return token.usedAt != null;
}

export async function findAccessTokenByPlain(
  plain: string,
  purpose?: AccessPurpose,
): Promise<AccessTokenWithRelations | null> {
  const token = await prisma.clientAccessToken.findUnique({
    where: { token: plain },
    include: {
      client: { select: { id: true, name: true, email: true, company: true } },
      project: {
        select: {
          id: true,
          title: true,
          service: true,
          value: true,
          contractContent: true,
          contractStatus: true,
        },
      },
    },
  });
  if (!token) return null;
  if (purpose && token.purpose !== purpose) return null;
  return token;
}

export function validateAccessToken(token: AccessTokenWithRelations): string | null {
  if (isAccessTokenUsed(token)) return "Este enlace ya fue utilizado.";
  if (isAccessTokenExpired(token)) return "Este enlace expiró.";
  return null;
}
