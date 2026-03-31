
# EventScout AI Command Center: Technical Blueprint

## 🗄️ PostgreSQL Schema (Prisma Format)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  user
  admin
}

enum EventState {
  DRAFT
  PUBLISHED
  ARCHIVED
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  role          Role      @default(user)
  interests     String[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  managedEvents Event[]   @relation("Manager")
  createdEvents Event[]   @relation("Creator")
}

model Event {
  id             String     @id @default(cuid())
  title          String
  description    String
  date           DateTime
  location       String
  state          EventState @default(DRAFT)
  priorityScore  Int        @default(5)
  tags           String[]
  conflictStatus Boolean    @default(false)
  
  rawSource      String?
  
  createdById    String
  createdBy      User       @relation("Creator", fields: [createdById], references: [id])
  
  publishedById  String?
  publishedBy    User?      @relation("Manager", fields: [publishedById], references: [id])
  publishedAt    DateTime?
  
  createdAt      DateTime   @default(now())
  updatedAt      DateTime   @updatedAt
}

model ScraperLog {
  id           String   @id @default(cuid())
  timestamp    DateTime @default(now())
  status       String
  message      String
  eventsFound  Int      @default(0)
}
```

## 🔄 Logic Flow: Scrape → Review → Publish

1.  **AI Scraper Discovery**: The `Jina Reader` or specific organizational scrapers ingest raw text.
2.  **AI Normalization (Gemini)**: 
    *   Extract structured fields (Date, Title, Location).
    *   Assign `priorityScore` (1-10) based on complexity/relevance.
    *   Generate metadata tags.
3.  **Database Ingestion**: Event is saved with `state: DRAFT`.
4.  **Admin Review**: Administrators view the `DRAFT` queue, manually override AI decisions if necessary.
5.  **Authorization Event**: Admin clicks "Publish".
    *   Backend updates `state` to `PUBLISHED`.
    *   Backend stamps `publishedBy` and `publishedAt`.
6.  **Real-Time Broadcast**: Server-Sent Events (SSE) or WebSockets notify all connected clients of the update.
7.  **Client-Side Ranking**: Frontend re-calculates the dashboard feed based on user `interests`.

## 🔐 Security Strategy (Middleware)

*   **Authentication**: Managed via NextAuth session tokens.
*   **Role Protection**:
    *   `/api/admin/*` and `/admin/*` routes gated by `middleware.ts`.
    *   Database access is strictly via Server Actions / Internal API (no direct frontend access).
    *   Row Level Security (RLS) or Service Layer logic ensures standard users cannot query `state: DRAFT` events.
