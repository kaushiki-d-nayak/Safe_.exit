import type { Config } from '@netlify/functions';
import { lte } from 'drizzle-orm';
import { database } from '../../db/index.js';
import { sessions } from '../../db/schema.js';
export default async () => {
  await database().delete(sessions).where(lte(sessions.expiresAt,new Date()));
};
export const config: Config = {schedule:'@hourly'};
