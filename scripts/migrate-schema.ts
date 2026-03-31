import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run(sql: string, label: string) {
    try {
        await pool.query(sql);
        console.log(`✓ ${label}`);
    } catch (err: any) {
        console.error(`✗ ${label}: ${err.message}`);
    }
}

async function main() {
    console.log('🚀 EventScout — Schema Migration\n');

    // ── Enums ──────────────────────────────────────────────────────────────
    await run(`
        DO $$ BEGIN
          CREATE TYPE "EventState" AS ENUM (
            'DISCOVERED','REVIEWED','SCHEDULED',
            'CONTACTED','PROPOSAL_SENT','COMPLETED','ARCHIVED'
          );
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
    `, 'Enum: EventState');

    await run(`
        DO $$ BEGIN
          CREATE TYPE "RejectionReason" AS ENUM (
            'MISSING_TITLE','MISSING_DATE','MISSING_LOCATION',
            'INVALID_DATE','PAST_EVENT','BLOCKED_KEYWORD',
            'NOT_RELEVANT_TO_IWORTH','DUPLICATE_EVENT',
            'HTTP_ERROR','SCRAPER_FAILURE'
          );
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
    `, 'Enum: RejectionReason');

    // ── Event columns ──────────────────────────────────────────────────────
    const eventCols: [string, string][] = [
        ['endDate',               'TIMESTAMP(3)'],
        ['locationCity',          'TEXT'],
        ['category',              'TEXT'],
        ['whyItMattersForIworth', 'TEXT'],
        ['iworthVertical',        'TEXT'],
        ['marketingStrategy',     'JSONB'],
        ['contactsCollected',     'INTEGER NOT NULL DEFAULT 0'],
        ['demosGiven',            'INTEGER NOT NULL DEFAULT 0'],
        ['salesClosed',           'INTEGER NOT NULL DEFAULT 0'],
        ['partnershipsStarted',   'INTEGER NOT NULL DEFAULT 0'],
        ['competitorsDetected',   "TEXT[] DEFAULT '{}'"],
        ['organizer',             'TEXT'],
        ['opportunityType',       'TEXT'],
        ['sourceUrl',             'TEXT'],
        ['suggestedAction',       'TEXT'],
        ['actionTaken',           'BOOLEAN NOT NULL DEFAULT false'],
        ['proposalSent',          'BOOLEAN NOT NULL DEFAULT false'],
        ['proposalAccepted',      'BOOLEAN NOT NULL DEFAULT false'],
        ['dealWon',               'BOOLEAN NOT NULL DEFAULT false'],
        ['estimatedValue',        'DOUBLE PRECISION'],
        ['outcomeNotes',          'TEXT'],
        ['priorityScore',         'INTEGER NOT NULL DEFAULT 5'],
        ['confidenceScore',       'INTEGER NOT NULL DEFAULT 0'],
        ['tags',                  "TEXT[] DEFAULT '{}'"],
        ['conflictStatus',        'BOOLEAN NOT NULL DEFAULT false'],
        ['relevanceScore',        'INTEGER NOT NULL DEFAULT 0'],
        ['geolocation',           'JSONB'],
        ['imageUrl',              'TEXT'],
        ['rawSource',             'TEXT'],
        ['publishedById',         'TEXT'],
        ['publishedAt',           'TIMESTAMP(3)'],
    ];

    for (const [col, type] of eventCols) {
        await run(
            `ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "${col}" ${type};`,
            `Event.${col}`
        );
    }

    // state column uses enum — needs special guard
    await run(`
        DO $$ BEGIN
          ALTER TABLE "Event" ADD COLUMN "state" "EventState" NOT NULL DEFAULT 'DISCOVERED';
        EXCEPTION WHEN duplicate_column THEN NULL;
        END $$;
    `, 'Event.state (enum)');

    // Unique constraint
    await run(`
        DO $$ BEGIN
          ALTER TABLE "Event" ADD CONSTRAINT "Event_title_date_key" UNIQUE ("title", "date");
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
    `, 'Event unique(title, date)');

    // ── RejectedEvent table ────────────────────────────────────────────────
    await run(`
        CREATE TABLE IF NOT EXISTS "RejectedEvent" (
          "id"             TEXT             NOT NULL,
          "url"            TEXT             NOT NULL,
          "titleExtracted" TEXT,
          "reason"         "RejectionReason" NOT NULL,
          "extractedJson"  JSONB,
          "sourceSite"     TEXT,
          "createdAt"      TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "RejectedEvent_pkey" PRIMARY KEY ("id")
        );
    `, 'Table: RejectedEvent');

    // ── AuditLog table ─────────────────────────────────────────────────────
    await run(`
        CREATE TABLE IF NOT EXISTS "AuditLog" (
          "id"          TEXT         NOT NULL,
          "timestamp"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "action"      TEXT         NOT NULL,
          "entityType"  TEXT         NOT NULL DEFAULT 'Event',
          "entityId"    TEXT,
          "entityTitle" TEXT         NOT NULL,
          "reason"      TEXT,
          "performedBy" TEXT         NOT NULL DEFAULT 'SYSTEM',
          CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
        );
    `, 'Table: AuditLog');

    await pool.end();
    console.log('\n✅ Migration complete.');
}

main().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
