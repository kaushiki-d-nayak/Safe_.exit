CREATE TABLE "safety_alerts" (
	"id" text PRIMARY KEY,
	"session_id" text NOT NULL,
	"kind" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"acknowledged_at" timestamp with time zone,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "safety_sessions" (
	"id" text PRIMARY KEY,
	"owner_id" text NOT NULL UNIQUE,
	"label" text NOT NULL,
	"share_hash" text NOT NULL UNIQUE,
	"expires_at" timestamp with time zone NOT NULL,
	"latitude" double precision,
	"longitude" double precision,
	"accuracy" double precision,
	"location_at" timestamp with time zone,
	"contact_seen" timestamp with time zone,
	"deadline" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trips" (
	"id" text PRIMARY KEY,
	"owner_id" text NOT NULL,
	"name" text NOT NULL,
	"destination" text NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text NOT NULL,
	"stay" text DEFAULT '' NOT NULL,
	"contact" text DEFAULT '' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "alerts_session_idx" ON "safety_alerts" ("session_id");--> statement-breakpoint
CREATE INDEX "trips_owner_idx" ON "trips" ("owner_id");--> statement-breakpoint
ALTER TABLE "safety_alerts" ADD CONSTRAINT "safety_alerts_session_id_safety_sessions_id_fkey" FOREIGN KEY ("session_id") REFERENCES "safety_sessions"("id") ON DELETE CASCADE;