import type { Config, Context } from '@netlify/functions';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { and, eq, gt, lte, desc, isNull, sql } from 'drizzle-orm';
import { database } from '../../db/index.js';
import { trips, sessions, alerts } from '../../db/schema.js';

function hash(value: string) { return createHash('sha256').update(value).digest('hex'); }
function reply(value: unknown, status = 200) { return Response.json(value, {status,headers:{'Cache-Control':'no-store'}}); }
function fail(message: string, status = 400): never { throw Object.assign(new Error(message), {status}); }
function field(body: any, name: string, max: number, required = false) {
  const value = typeof body[name] === 'string' ? body[name].trim() : '';
  if (value.length > max || (required && !value)) fail(`Please enter a valid ${name}.`);
  return value;
}
function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(value+'T00:00:00Z');
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0,10) === value;
}

export default async (req: Request, context: Context) => {
  try {
    const url = new URL(req.url);
    if (!['GET','POST','DELETE'].includes(req.method)) return reply({error:'Method not allowed.'},405);
    if (req.method !== 'GET' && req.headers.get('origin') !== url.origin) return reply({error:'Request origin is not allowed.'},403);
    let browser = context.cookies.get('safeexit_browser');
    if (!browser || !/^[a-f0-9]{64}$/.test(browser)) {
      browser = randomBytes(32).toString('hex');
      context.cookies.set({name:'safeexit_browser',value:browser,httpOnly:true,secure:url.protocol === 'https:',sameSite:'Strict',path:'/',maxAge:60*60*24*365});
    }
    const ownerId = hash(browser);
    const path = url.pathname.replace(/^\/api\//,'');
    if (path === 'workspace' && req.method === 'GET') return reply({ready:true});
    const db = database();
    if (Number(req.headers.get('content-length') || 0) > 16000) return reply({error:'Request too large.'},413);
    const raw = req.method === 'POST' ? await req.text() : '';
    if (raw.length > 16000) return reply({error:'Request too large.'},413);
    const body = raw ? JSON.parse(raw) : {};
    if (!body || typeof body !== 'object' || Array.isArray(body)) fail('Please send a valid request.');

    if (path === 'trips') {
      if (req.method === 'GET') {
        const rows = await db.select().from(trips).where(eq(trips.ownerId,ownerId));
        return reply({trips:rows.map(({ownerId: _,...trip})=>trip)});
      }
      if (req.method === 'POST') {
        const input = Object.fromEntries(Object.entries({name:60,destination:80,startDate:10,endDate:10,stay:120,contact:60,notes:400}).map(([key,max])=>[key,field(body,key,max,['name','destination','startDate','endDate'].includes(key))]));
        if (!validDate(input.startDate) || !validDate(input.endDate) || input.endDate < input.startDate) fail('Choose valid dates with the end on or after the start.');
        const existing = await db.select({id:trips.id}).from(trips).where(eq(trips.ownerId,ownerId)).limit(50);
        if (existing.length >= 50) fail('You can save up to 50 trips.');
        const [trip] = await db.insert(trips).values({id:randomUUID(),ownerId,...input} as typeof trips.$inferInsert).returning();
        const {ownerId: _,...safe} = trip;
        return reply({trip:safe},201);
      }
    }
    if (path.startsWith('trips/') && req.method === 'DELETE') {
      await db.delete(trips).where(and(eq(trips.id,path.slice(6)),eq(trips.ownerId,ownerId)));
      return reply({ok:true});
    }
    if (path !== 'safety') return reply({error:'Not found.'},404);
    if (req.method === 'DELETE') return reply({error:'Method not allowed.'},405);
    const now = new Date();
    await db.delete(sessions).where(lte(sessions.expiresAt,now));
    const token = req.headers.get('X-SafeExit-Link');
    if (token && !/^[a-f0-9]{64}$/.test(token)) fail('This sharing link is unavailable.',404);
    const condition = token ? eq(sessions.shareHash,hash(token)) : eq(sessions.ownerId,ownerId);
    let [session] = await db.select().from(sessions).where(condition).limit(1);
    const action = body.action;
    if (req.method === 'POST' && action === 'create') {
      if (token) fail('Only the traveller can create a session.',403);
      if (session) fail('End your active session before creating another.',409);
      if (body.consent !== true) fail('Consent is required before sharing.');
      const label = field(body,'label',60,true);
      if (![30,60,120,240].includes(body.duration)) fail('Choose a valid expiry.');
      const shareToken = randomBytes(32).toString('hex');
      [session] = await db.insert(sessions).values({id:randomUUID(),ownerId,label,shareHash:hash(shareToken),expiresAt:new Date(Date.now()+body.duration*60000)}).returning();
      return reply({shareToken},201);
    }
    if (!session) {
      if (token) fail('This sharing link has expired or was revoked.',404);
      if (req.method === 'POST') fail('This safety session has ended. Start a new session before sending updates.',409);
      return reply({session:null});
    }
    if (req.method === 'POST') {
      const ownerActions = ['location','arm','checkin','sos','rotate','end'];
      if (token && ownerActions.includes(action)) fail('Only the traveller can perform this action.',403);
      if (action === 'end') {
        await db.delete(sessions).where(eq(sessions.id,session.id));
        return reply({ok:true});
      } else if (action === 'rotate') {
        const shareToken = randomBytes(32).toString('hex');
        await db.update(sessions).set({shareHash:hash(shareToken),contactSeen:null}).where(eq(sessions.id,session.id));
        return reply({shareToken});
      } else if (action === 'location') {
        const {latitude,longitude,accuracy} = body;
        if (![latitude,longitude,accuracy].every(Number.isFinite) || Math.abs(latitude)>90 || Math.abs(longitude)>180 || accuracy<0) fail('Invalid location.');
        await db.update(sessions).set({latitude,longitude,accuracy,locationAt:now}).where(eq(sessions.id,session.id));
      } else if (action === 'arm') {
        if (![5,15,30,60].includes(body.minutes)) fail('Choose a valid deadline.');
        if (Date.now()+body.minutes*60000 > session.expiresAt.getTime()) fail('Choose a deadline before this sharing link expires, or start a longer session.');
        await db.update(sessions).set({deadline:new Date(Date.now()+body.minutes*60000)}).where(eq(sessions.id,session.id));
      } else if (action === 'checkin') {
        await db.update(sessions).set({deadline:null}).where(eq(sessions.id,session.id));
        await db.update(alerts).set({resolvedAt:now}).where(and(eq(alerts.sessionId,session.id),isNull(alerts.resolvedAt)));
      } else if (action === 'sos') {
        const recent = await db.select({id:alerts.id}).from(alerts).where(and(eq(alerts.sessionId,session.id),eq(alerts.kind,'sos'),gt(alerts.createdAt,new Date(Date.now()-15000)))).limit(1);
        if (!recent.length) await db.insert(alerts).values({id:randomUUID(),sessionId:session.id,kind:'sos'});
      } else if (action === 'acknowledge') {
        if (!token) fail('Open the contact dashboard to acknowledge.',403);
        await db.update(alerts).set({acknowledgedAt:now}).where(and(eq(alerts.id,field(body,'alertId',100,true)),eq(alerts.sessionId,session.id),isNull(alerts.acknowledgedAt)));
      } else fail('Unknown action.');
    }
    [session] = await db.select().from(sessions).where(eq(sessions.id,session.id));
    if (!session) return reply({session:null});
    if (session.deadline && session.deadline <= now) {
      // Conditional insert prevents a concurrent check-in from recreating a resolved deadline.
      await db.insert(alerts).select(db.select({
        id:sql<string>`${session.id+'-'+session.deadline.getTime()}`,
        sessionId:sessions.id,
        kind:sql<string>`'missed'`,
        createdAt:sql<Date>`${sessions.deadline}`,
        acknowledgedAt:sql<Date|null>`NULL`,
        resolvedAt:sql<Date|null>`NULL`,
      }).from(sessions).where(and(eq(sessions.id,session.id),eq(sessions.deadline,session.deadline)))).onConflictDoNothing();
    }
    if (token) {
      await db.update(sessions).set({contactSeen:now}).where(eq(sessions.id,session.id));
      session.contactSeen = now;
    }
    const timeline = await db.select().from(alerts).where(eq(alerts.sessionId,session.id)).orderBy(desc(alerts.createdAt)).limit(50);
    const {ownerId: _,shareHash: __,...safe} = session;
    return reply({session:safe,alerts:timeline,role:token?'contact':'owner',serverTime:now});
  } catch (error: any) {
    const status = error.status || (error instanceof SyntaxError ? 400 : 500);
    return reply({error:status === 500 ? 'Unable to connect right now. Please try again.' : error.message},status);
  }
};
export const config: Config = {path:'/api/*'};
