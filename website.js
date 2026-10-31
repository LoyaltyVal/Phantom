const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

loadEnvFile();

const root = path.join(__dirname, 'website');
const mimeTypes = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8' };
const discordApi = 'https://discord.com/api/v10';
const rateBuckets = new Map();
let mongooseConnection;

function loadEnvFile() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match || Object.hasOwn(process.env, match[1])) continue;
    process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}

function configReady() {
  const required = ['DISCORD_CLIENT_ID', 'DISCORD_CLIENT_SECRET', 'DISCORD_REDIRECT_URI', 'DISCORD_BOT_TOKEN', 'MONGODB_URI'];
  if (process.env.NODE_ENV === 'production') required.push('APP_ORIGIN');
  if (!required.every(key => Boolean(process.env[key]))) return false;
  try {
    const redirect = new URL(process.env.DISCORD_REDIRECT_URI);
    if (!['http:', 'https:'].includes(redirect.protocol) || redirect.pathname !== '/auth/callback' || redirect.search || redirect.hash) return false;
    if (process.env.NODE_ENV === 'production') {
      const origin = new URL(process.env.APP_ORIGIN);
      return origin.protocol === 'https:' && origin.origin === process.env.APP_ORIGIN.replace(/\/$/, '') && redirect.origin === origin.origin;
    }
    return true;
  } catch { return false; }
}

function json(response, status, body) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  response.end(JSON.stringify(body));
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a || ''));
  const right = Buffer.from(String(b || ''));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function getCookie(request, name) {
  const cookie = (request.headers.cookie || '').split(';').map(value => value.trim()).find(value => value.startsWith(`${name}=`));
  const value = cookie ? cookie.slice(name.length + 1) : '';
  return /^[a-f0-9]{64}$/i.test(value) ? value : '';
}

function sessionCookieName() { return process.env.NODE_ENV === 'production' ? '__Host-phantom_session' : 'phantom_session'; }

function setSessionCookie(response, sessionId, maxAge = 60 * 60 * 24 * 7) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  response.setHeader('Set-Cookie', `${sessionCookieName()}=${encodeURIComponent(sessionId)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${secure}`);
}

function hashSessionKey(key) { return crypto.createHash('sha256').update(key).digest('hex'); }

function rateLimit(request, scope, limit, windowMs) {
  const key = `${request.socket.remoteAddress || 'unknown'}:${scope}`;
  const now = Date.now();
  let bucket = rateBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs };
    rateBuckets.set(key, bucket);
  }
  bucket.count += 1;
  return bucket.count <= limit;
}

async function currentSession(request) {
  const key = getCookie(request, sessionCookieName());
  if (!key || !configReady()) return null;
  await ensureDatabase();
  const Session = require('./models/dashboardSessionModel');
  const record = await Session.findOne({ keyHash: hashSessionKey(key), expiresAt: { $gt: new Date() } }).lean();
  return record ? { key, session: record.data } : null;
}

async function saveSession(key, data, expiresAt) {
  const Session = require('./models/dashboardSessionModel');
  await Session.create({ keyHash: hashSessionKey(key), data, expiresAt });
}

async function removeSession(key) {
  const Session = require('./models/dashboardSessionModel');
  await Session.deleteOne({ keyHash: hashSessionKey(key) });
}

async function createOAuthState(state, expiresAt) {
  const OAuthState = require('./models/dashboardOAuthStateModel');
  await OAuthState.create({ stateHash: hashSessionKey(state), expiresAt: new Date(expiresAt) });
}

async function consumeOAuthState(state) {
  await ensureDatabase();
  const OAuthState = require('./models/dashboardOAuthStateModel');
  const record = await OAuthState.findOneAndDelete({ stateHash: hashSessionKey(state), expiresAt: { $gt: new Date() } }).lean();
  return Boolean(record);
}

function getRedirectUri(request) {
  if (process.env.DISCORD_REDIRECT_URI) return process.env.DISCORD_REDIRECT_URI;
  const protocol = request.socket.encrypted ? 'https' : 'http';
  return `${protocol}://${request.headers.host}/auth/callback`;
}

function safeOrigin(request) {
  if (process.env.APP_ORIGIN) return process.env.APP_ORIGIN.replace(/\/$/, '');
  const protocol = request.socket.encrypted ? 'https' : 'http';
  return `${protocol}://${request.headers.host}`;
}

async function requestDiscord(route, options = {}) {
  let response;
  for (let attempt = 0; attempt < 3; attempt++) {
    response = await fetch(`${discordApi}${route}`, {
      ...options,
      signal: options.signal || AbortSignal.timeout(10000),
      headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`, 'Content-Type': 'application/json', ...options.headers }
    });
    if (response.status !== 429 || attempt === 2) break;
    const retryAfter = Number(response.headers.get('retry-after') || 0.5);
    await new Promise(resolve => setTimeout(resolve, Math.min(2000, Math.max(100, retryAfter * 1000))));
  }
  if (!response.ok) {
    const error = new Error(`Discord API request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }
  if (response.status === 204) return null;
  return response.json();
}

async function ensureDatabase() {
  const mongoose = require('mongoose');
  if (mongooseConnection && mongoose.connection.readyState === 0) mongooseConnection = null;
  if (!mongooseConnection) {
    mongooseConnection = mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 7000 }).then(async () => {
      const Session = require('./models/dashboardSessionModel');
      const OAuthState = require('./models/dashboardOAuthStateModel');
      await Promise.all([Session.init(), OAuthState.init()]);
    });
  }
  try { await mongooseConnection; }
  catch (error) { mongooseConnection = null; throw error; }
}

async function botIsOnline() {
  const BotStatus = require('./models/botStatusModel');
  const status = await BotStatus.findById('primary').lean();
  return Boolean(status?.lastSeenAt && Date.now() - status.lastSeenAt.getTime() < 90000);
}

async function readJson(request, limit = 20000) {
  if (!request.headers['content-type']?.toLowerCase().startsWith('application/json')) throw Object.assign(new Error('Content-Type must be application/json.'), { status: 415 });
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > limit) throw Object.assign(new Error('Request body is too large.'), { status: 413 });
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); }
  catch { throw Object.assign(new Error('Send valid JSON.'), { status: 400 }); }
}

function guildPermission(session, guildId) {
  const guild = session.guilds.find(item => item.id === guildId);
  if (!guild) return false;
  try {
    const permissions = BigInt(guild.permissions);
    return (permissions & 0x8n) === 0x8n || (permissions & 0x20n) === 0x20n;
  } catch { return false; }
}

async function authorizeGuild(request, guildId) {
  const auth = await currentSession(request);
  if (!auth) throw Object.assign(new Error('Sign in with Discord to continue.'), { status: 401 });
  if (!guildPermission(auth.session, guildId)) throw Object.assign(new Error('You need Manage Server or Administrator permission for this server.'), { status: 403 });
  let guild;
  try { guild = await requestDiscord(`/guilds/${guildId}?with_counts=true`); }
  catch (error) {
    if (error.status === 403 || error.status === 404) throw Object.assign(new Error('Phantom is not available in this server.'), { status: 404 });
    throw error;
  }
  const [channels, roles, member] = await Promise.all([
    requestDiscord(`/guilds/${guildId}/channels`),
    requestDiscord(`/guilds/${guildId}/roles`),
    requestDiscord(`/guilds/${guildId}/members/${auth.session.user.id}`).catch(error => {
      if (error.status === 404) throw Object.assign(new Error('Your Discord account is no longer a member of this server.'), { status: 403 });
      if (error.status === 403) throw Object.assign(new Error('The Phantom bot needs the Server Members privileged intent enabled to verify current server permissions.'), { status: 503 });
      throw error;
    })
  ]);
  const memberRoleIds = new Set([guildId, ...(member.roles || [])]);
  const permissions = roles.filter(role => memberRoleIds.has(role.id)).reduce((value, role) => value | BigInt(role.permissions), 0n);
  if (guild.owner_id !== auth.session.user.id && (permissions & (0x8n | 0x20n)) === 0n) {
    throw Object.assign(new Error('Your current server roles no longer include Manage Server or Administrator permission.'), { status: 403 });
  }
  return { ...auth, guild, channels, roles, member };
}

async function handleApi(request, response, url) {
  if (request.method === 'GET' && url.pathname === '/healthz') {
    if (!configReady()) return json(response, 503, { status: 'not_ready' });
    await ensureDatabase();
    return json(response, 200, { status: 'ok' });
  }

  if (url.pathname.startsWith('/api/') && !rateLimit(request, 'api', 300, 60 * 1000)) {
    return json(response, 429, { error: 'Too many dashboard requests. Please wait a minute and try again.' });
  }

  if (request.method === 'GET' && url.pathname === '/api/me') {
    const configured = configReady();
    const auth = configured ? await currentSession(request) : null;
    return json(response, 200, { configured, applicationId: configured ? process.env.DISCORD_CLIENT_ID : null, csrfToken: auth?.session.csrfToken || null, user: auth?.session.user || null });
  }

  if (request.method === 'GET' && url.pathname === '/api/guilds') {
    const auth = await currentSession(request);
    if (!auth) return json(response, 401, { error: 'Sign in with Discord to continue.' });
    if (!configReady()) return json(response, 503, { error: 'The dashboard needs Discord OAuth, bot, and database settings before it can connect.' });
    const manageable = auth.session.guilds.filter(item => guildPermission(auth.session, item.id));
    const guilds = [];
    for (let index = 0; index < manageable.length; index += 4) {
      const batch = await Promise.all(manageable.slice(index, index + 4).map(async item => {
        try {
          const guild = await requestDiscord(`/guilds/${item.id}?with_counts=true`);
          return { id: guild.id, name: guild.name, icon: guild.icon, memberCount: guild.approximate_member_count || guild.member_count || null };
        } catch (error) {
          if (error.status === 403 || error.status === 404) return null;
          throw error;
        }
      }));
      guilds.push(...batch);
    }
    return json(response, 200, { guilds: guilds.filter(Boolean) });
  }

  if (request.method === 'GET' && url.pathname === '/auth/login') {
    if (!configReady()) return json(response, 503, { error: 'The dashboard has not been configured. Copy .env.example to .env and add your Discord OAuth, bot, database, and session settings.' });
    if (!rateLimit(request, 'login', 20, 60 * 1000)) return json(response, 429, { error: 'Too many sign-in attempts. Please wait a minute and try again.' });
    const state = crypto.randomBytes(32).toString('hex');
    await ensureDatabase();
    await createOAuthState(state, Date.now() + 10 * 60 * 1000);
    const query = new URLSearchParams({ client_id: process.env.DISCORD_CLIENT_ID, redirect_uri: getRedirectUri(request), response_type: 'code', scope: 'identify guilds', state });
    response.writeHead(302, { Location: `https://discord.com/oauth2/authorize?${query}` }).end();
    return;
  }

  if (request.method === 'POST' && url.pathname === '/auth/logout') {
    const auth = await currentSession(request);
    if (!auth) return json(response, 200, { ok: true });
    if (request.headers.origin !== safeOrigin(request) || !safeEqual(request.headers['x-csrf-token'], auth.session.csrfToken)) return json(response, 403, { error: 'Security check failed.' });
    await removeSession(auth.key);
    setSessionCookie(response, '', 0);
    return json(response, 200, { ok: true });
  }

  if (request.method === 'GET' && url.pathname === '/auth/callback') {
    if (!rateLimit(request, 'callback', 30, 60 * 1000)) return json(response, 429, { error: 'Too many sign-in callbacks. Please wait a minute and try again.' });
    const state = url.searchParams.get('state');
    if (!state || !await consumeOAuthState(state) || !url.searchParams.get('code')) return json(response, 400, { error: 'Discord sign-in expired. Please try again.' });
    const tokenResponse = await fetch(`${discordApi}/oauth2/token`, {
      method: 'POST', signal: AbortSignal.timeout(10000), headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: process.env.DISCORD_CLIENT_ID, client_secret: process.env.DISCORD_CLIENT_SECRET, grant_type: 'authorization_code', code: url.searchParams.get('code'), redirect_uri: getRedirectUri(request) })
    });
    if (!tokenResponse.ok) return json(response, 401, { error: 'Discord sign-in could not be completed.' });
    const { access_token: accessToken } = await tokenResponse.json();
    const [userResponse, guildResponse] = await Promise.all([
      fetch(`${discordApi}/users/@me`, { signal: AbortSignal.timeout(10000), headers: { Authorization: `Bearer ${accessToken}` } }),
      fetch(`${discordApi}/users/@me/guilds`, { signal: AbortSignal.timeout(10000), headers: { Authorization: `Bearer ${accessToken}` } })
    ]);
    if (!userResponse.ok || !guildResponse.ok) return json(response, 401, { error: 'Discord did not return your account and server permissions.' });
    const user = await userResponse.json();
    const guilds = await guildResponse.json();
    const sessionId = crypto.randomBytes(32).toString('hex');
    const sessionHours = Math.min(168, Math.max(1, Number(process.env.SESSION_TTL_HOURS) || 12));
    const sessionMaxAge = sessionHours * 60 * 60;
    const expiresAt = new Date(Date.now() + sessionMaxAge * 1000);
    await ensureDatabase();
    await saveSession(sessionId, { user: { id: user.id, username: user.global_name || user.username, avatar: user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=64` : null }, guilds, csrfToken: crypto.randomBytes(32).toString('hex') }, expiresAt);
    setSessionCookie(response, sessionId, sessionMaxAge);
    response.writeHead(302, { Location: '/' }).end();
    return;
  }

  const match = url.pathname.match(/^\/api\/guilds\/([0-9]{17,20})(?:\/(prefix|audit-log|tickets|verification))?$/);
  if (!match) return json(response, 404, { error: 'API endpoint not found.' });
  const guildId = match[1];
  const section = match[2] || '';
  const sessionAuth = await currentSession(request);
  if (!sessionAuth) return json(response, 401, { error: 'Sign in with Discord to continue.' });
  if (request.method !== 'GET') {
    if (request.headers.origin !== safeOrigin(request)) return json(response, 403, { error: 'Request origin is not allowed.' });
    if (!safeEqual(request.headers['x-csrf-token'], sessionAuth.session.csrfToken)) return json(response, 403, { error: 'Security token expired. Refresh the page and try again.' });
  }
  if (request.method !== 'GET' && request.method !== 'PATCH' && request.method !== 'POST' && request.method !== 'DELETE') return json(response, 405, { error: 'Method not allowed.' });

  const auth = await authorizeGuild(request, guildId);
  if (request.method === 'GET' && !section) {
    await ensureDatabase();
    const Guild = require('./models/guildModel');
    const Audit = require('./addons/moderation/models/auditLogModel');
    const Ticket = require('./addons/tickets/models/ticketModel');
    const Verification = require('./addons/verification/models/verification');
    const BotStatus = require('./models/botStatusModel');
    const [prefix, audit, tickets, verification] = await Promise.all([
      Guild.findOne({ guild_id: guildId }).lean(), Audit.findOne({ guildId }).lean(), Ticket.findOne({ guildId }).lean(), Verification.findOne({ guildId }).lean()
    ]);
    const botStatus = await BotStatus.findById('primary').lean();
    return json(response, 200, {
      guild: { id: auth.guild.id, name: auth.guild.name, icon: auth.guild.icon, memberCount: auth.guild.approximate_member_count || auth.guild.member_count || null },
      botOnline: Boolean(botStatus && Date.now() - botStatus.lastSeenAt.getTime() < 90000),
      channels: auth.channels.filter(channel => channel.type === 0 || channel.type === 4).map(({ id, name, type, parent_id: parentId }) => ({ id, name, type, parentId })),
      roles: auth.roles.filter(role => !role.managed && role.id !== guildId).map(({ id, name, color, position }) => ({ id, name, color, position })),
      config: { prefix: prefix?.prefix || '!', audit: audit ? { channelId: audit.channelId, enabled: audit.isEnable } : null, tickets: tickets ? { channelLog: tickets.channelLog, channelTranscript: tickets.channelTranscript, categories: tickets.categories || [] } : null, verification: verification ? { channelId: verification.channelId, addRole: verification.addRole, removeRole: verification.removeRole || '', configured: true } : null }
    });
  }

  const body = ['PATCH', 'POST'].includes(request.method) ? await readJson(request) : {};
  await ensureDatabase();
  if (section === 'prefix' && request.method === 'PATCH') {
    if (typeof body.prefix !== 'string' || !/^[^\s@<>]{1,4}$/.test(body.prefix)) return json(response, 400, { error: 'Use a prefix from 1 to 4 characters without spaces or mentions.' });
    const Guild = require('./models/guildModel');
    await Guild.findOneAndUpdate({ guild_id: guildId }, { guild_id: guildId, prefix: body.prefix }, { upsert: true, new: true, setDefaultsOnInsert: true });
    return json(response, 200, { ok: true, message: 'Command prefix updated.' });
  }
  if (section === 'audit-log' && request.method === 'PATCH') {
    if (typeof body.channelId !== 'string' || !auth.channels.some(channel => channel.id === body.channelId && channel.type === 0) || typeof body.enabled !== 'boolean') return json(response, 400, { error: 'Choose a text channel and whether logging should be enabled.' });
    const Audit = require('./addons/moderation/models/auditLogModel');
    await Audit.findOneAndUpdate({ guildId }, { guildId, channelId: body.channelId, isEnable: body.enabled }, { upsert: true, new: true });
    return json(response, 200, { ok: true, message: body.enabled ? 'Audit logging enabled.' : 'Audit logging disabled.' });
  }
  if (section === 'tickets' && request.method === 'PATCH') {
    if (typeof body.channelLog !== 'string' || typeof body.channelTranscript !== 'string' || !auth.channels.some(channel => channel.id === body.channelLog && channel.type === 0) || !auth.channels.some(channel => channel.id === body.channelTranscript && channel.type === 0)) return json(response, 400, { error: 'Choose valid text channels for ticket logs and transcripts.' });
    const Ticket = require('./addons/tickets/models/ticketModel');
    await Ticket.findOneAndUpdate({ guildId }, { $set: { channelLog: body.channelLog, channelTranscript: body.channelTranscript }, $setOnInsert: { guildId } }, { upsert: true, new: true });
    return json(response, 200, { ok: true, message: 'Ticket channels saved.' });
  }
  if (section === 'tickets' && request.method === 'POST') {
    const action = body.action;
    const Ticket = require('./addons/tickets/models/ticketModel');
    const ticket = await Ticket.findOne({ guildId });
    if (!ticket?.channelLog || !ticket?.channelTranscript) return json(response, 400, { error: 'Set the ticket log and transcript channels before managing categories.' });
    if (action === 'category') {
      const { name, emoji, description, style, roleId, channelId } = body;
      if (typeof name !== 'string' || !name.trim() || name.length > 45 || typeof emoji !== 'string' || emoji.length > 32 || typeof description !== 'string' || !description.trim() || description.length > 100 || !['Danger', 'Success', 'Primary', 'Secondary'].includes(style) || !auth.roles.some(role => role.id === roleId) || !auth.channels.some(channel => channel.id === channelId && channel.type === 4)) return json(response, 400, { error: 'Check the category name, emoji, description, style, support role, and server category.' });
      if ((ticket.categories || []).length >= 5) return json(response, 400, { error: 'Phantom supports up to 5 ticket categories per panel.' });
      if ((ticket.categories || []).some(category => category.name.toLowerCase() === name.trim().toLowerCase())) return json(response, 409, { error: 'A ticket category with this name already exists.' });
      ticket.categories.push({ name: name.trim(), emoji: emoji.trim(), description: description.trim(), style, role: roleId, channel: channelId });
      await ticket.save();
      return json(response, 200, { ok: true, message: 'Ticket category added.' });
    }
    if (action === 'delete-category' && typeof body.name === 'string') {
      ticket.categories = (ticket.categories || []).filter(category => category.name !== body.name);
      await ticket.save();
      return json(response, 200, { ok: true, message: 'Ticket category removed.' });
    }
    if (action === 'send-panel' && typeof body.channelId === 'string') {
      if (!await botIsOnline()) return json(response, 503, { error: 'The Phantom bot is offline. Start the bot before posting a ticket panel.' });
      const target = auth.channels.find(channel => channel.id === body.channelId && channel.type === 0);
      if (!target || !ticket.categories?.length) return json(response, 400, { error: 'Choose a text channel and add at least one ticket category first.' });
      const styles = { Primary: 1, Secondary: 2, Success: 3, Danger: 4 };
      const components = ticket.categories.slice(0, 5).map(category => ({ type: 2, style: styles[category.style] || 1, label: category.name.slice(0, 80), custom_id: `ticketCategories-${category.name}`, ...(category.emoji ? { emoji: { name: category.emoji } } : {}) }));
      const sent = await requestDiscord(`/channels/${target.id}/messages`, { method: 'POST', body: JSON.stringify({ embeds: [{ title: 'Create a ticket', description: ticket.categories.map(category => `${category.emoji} **${category.name}** — ${category.description}`).join('\n'), color: 0x9162dc }], components: [{ type: 1, components }] }) });
      ticket.categoryPanel = sent.id;
      await ticket.save();
      return json(response, 200, { ok: true, message: 'Ticket panel posted.' });
    }
  }
  if (section === 'verification' && request.method === 'PATCH') {
    if (!await botIsOnline()) return json(response, 503, { error: 'The Phantom bot is offline. Start the bot before posting a verification panel.' });
    const { channelId, addRole, removeRole = '', message } = body;
    const addRoleData = auth.roles.find(role => role.id === addRole && role.id !== guildId && !role.managed);
    const removeRoleData = auth.roles.find(role => role.id === removeRole && role.id !== guildId && !role.managed);
    if (!auth.channels.some(channel => channel.id === channelId && channel.type === 0) || !addRoleData || (removeRole && !removeRoleData) || (removeRole && removeRole === addRole) || typeof message !== 'string' || !message.trim() || message.length > 1800) return json(response, 400, { error: 'Choose a text channel, distinct valid roles, and a message under 1,800 characters.' });
    const botUser = await requestDiscord('/users/@me');
    const me = await requestDiscord(`/guilds/${guildId}/members/${botUser.id}`);
    const botTopRole = auth.roles.filter(role => me.roles.includes(role.id)).sort((a, b) => b.position - a.position)[0];
    if (!botTopRole || [addRoleData, removeRoleData].filter(Boolean).some(role => role.position >= botTopRole.position)) return json(response, 400, { error: 'Move the bot role above the roles you want it to assign.' });
    const sent = await requestDiscord(`/channels/${channelId}/messages`, { method: 'POST', body: JSON.stringify({ content: message.trim(), allowed_mentions: { parse: [] }, components: [{ type: 1, components: [{ type: 2, style: 3, label: 'Verify', custom_id: 'verification' }] }] }) });
    const Verification = require('./addons/verification/models/verification');
    await Verification.findOneAndUpdate({ guildId }, { guildId, channelId, addRole, removeRole: removeRole || null, messageId: sent.id }, { upsert: true, new: true });
    return json(response, 200, { ok: true, message: 'Verification panel posted and configured.' });
  }
  return json(response, 404, { error: 'This control is not available.' });
}

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/') || url.pathname === '/healthz') return await handleApi(request, response, url);
    const pathname = decodeURIComponent(url.pathname);
    const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
    const filePath = path.resolve(root, relativePath);
    if (!filePath.startsWith(root + path.sep)) return response.writeHead(403).end('Forbidden');
    if (request.method !== 'GET' && request.method !== 'HEAD') return response.writeHead(405, { Allow: 'GET, HEAD' }).end();
    fs.readFile(filePath, (error, content) => {
      if (error) return response.writeHead(error.code === 'ENOENT' ? 404 : 500).end('Not found');
      const headers = {
        'Content-Type': mimeTypes[path.extname(filePath)] || 'application/octet-stream',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'no-referrer',
        'X-Frame-Options': 'DENY',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
        'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' https://cdn.discordapp.com data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self' https://discord.com"
      };
      if (process.env.NODE_ENV === 'production') {
        headers['Strict-Transport-Security'] = 'max-age=31536000';
        headers['Content-Security-Policy'] += '; upgrade-insecure-requests';
      }
      response.writeHead(200, headers);
      response.end(request.method === 'HEAD' ? undefined : content);
    });
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND' || error.name === 'MongooseServerSelectionError') return json(response, 503, { error: 'The server database is unavailable. Check the private MONGODB_URI setting.' });
    json(response, error.status || 500, { error: error.status ? error.message : 'The request could not be completed.' });
  }
});

const port = Number(process.env.WEBSITE_PORT || 3000);
server.requestTimeout = 15000;
server.headersTimeout = 10000;
server.keepAliveTimeout = 5000;
server.maxRequestsPerSocket = 1000;
async function startServer() {
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('WEBSITE_PORT must be a valid TCP port.');
  if (process.env.NODE_ENV === 'production') {
    if (!configReady()) throw new Error('Production startup needs valid Discord OAuth, redirect URI, bot token, MongoDB URI, and HTTPS APP_ORIGIN settings.');
    const bot = await requestDiscord('/users/@me');
    if (bot.id !== process.env.DISCORD_CLIENT_ID) throw new Error('DISCORD_CLIENT_ID must match the configured Discord bot application.');
    await ensureDatabase();
  }
  server.listen(port, () => console.log(`Phantom dashboard listening on port ${port}`));
}
startServer().catch(error => {
  console.error(`Phantom dashboard could not start: ${error.message}`);
  process.exitCode = 1;
});

setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of rateBuckets) if (bucket.resetAt <= now) rateBuckets.delete(key);
}, 60 * 1000).unref();

server.on('close', async () => {
  if (mongooseConnection) await require('mongoose').disconnect().catch(() => {});
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
