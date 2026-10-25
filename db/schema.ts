import { pgTable, text, timestamp, doublePrecision, index } from 'drizzle-orm/pg-core';

export const trips = pgTable('trips', {
  id: text().primaryKey(),
  ownerId: text('owner_id').notNull(),
  name: text().notNull(),
  destination: text().notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  stay: text().notNull().default(''),
  contact: text().notNull().default(''),
  notes: text().notNull().default(''),
  createdAt: timestamp('created_at', {withTimezone: true}).notNull().defaultNow(),
}, table => [index('trips_owner_idx').on(table.ownerId)]);

export const sessions = pgTable('safety_sessions', {
  id: text().primaryKey(),
  ownerId: text('owner_id').notNull().unique(),
  label: text().notNull(),
  shareHash: text('share_hash').notNull().unique(),
  expiresAt: timestamp('expires_at', {withTimezone:true}).notNull(),
  latitude: doublePrecision(),
  longitude: doublePrecision(),
  accuracy: doublePrecision(),
  locationAt: timestamp('location_at', {withTimezone:true}),
  contactSeen: timestamp('contact_seen', {withTimezone:true}),
  deadline: timestamp({withTimezone:true}),
  createdAt: timestamp('created_at', {withTimezone:true}).notNull().defaultNow(),
});

export const alerts = pgTable('safety_alerts', {
  id: text().primaryKey(),
  sessionId: text('session_id').notNull().references(() => sessions.id, {onDelete:'cascade'}),
  kind: text().notNull(),
  createdAt: timestamp('created_at', {withTimezone:true}).notNull().defaultNow(),
  acknowledgedAt: timestamp('acknowledged_at', {withTimezone:true}),
  resolvedAt: timestamp('resolved_at', {withTimezone:true}),
}, table => [index('alerts_session_idx').on(table.sessionId)]);
