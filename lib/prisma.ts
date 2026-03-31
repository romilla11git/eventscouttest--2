import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

**4.** Commit the file → Vercel will auto-redeploy

---

## Also — you'll need environment variables

Since your app uses Prisma + a PostgreSQL database (`pg` package), Vercel will also need your database URL. After the build succeeds, go to:

**Vercel → Project Settings → Environment Variables** and add:
```
DATABASE_URL = your_postgres_connection_string