const modules = [
  { id: 'moderation', name: 'Moderation & logs', icon: '◇', tone: 'violet', description: 'Choose where server audit events are recorded.', commands: ['/auditlog'], live: true },
  { id: 'tickets', name: 'Tickets', icon: '▤', tone: 'amber', description: 'Set up member support, ticket categories, and panels.', commands: ['/ticket-manager setup', '/ticket-manager categories', '/claim', '/close'], live: true },
  { id: 'verification', name: 'Verification', icon: '✓', tone: 'green', description: 'Post a captcha verification panel and choose member roles.', commands: ['/setverification'], live: true },
  { id: 'invites', name: 'Invite tracking', icon: '↗', tone: 'blue', description: 'Track new member invites and invite statistics.', commands: ['/invites', '/topinvites', '/invitation'], live: false },
  { id: 'economy', name: 'Economy', icon: '◉', tone: 'green', description: 'Member balances, work, games, and transfers.', commands: ['!balance', '!work', '!pay', '!topbalance', '/money'], live: false },
  { id: 'fun', name: 'Fun & games', icon: '✳', tone: 'amber', description: 'Lightweight games and community commands.', commands: ['/8ball', '/blackjack'], live: false },
  { id: 'utility', name: 'Utilities & help', icon: '⌘', tone: 'blue', description: 'Help members discover bot commands and prefixes.', commands: ['/help', '!prefix', '!setPrefix'], live: true }
];
const commands = [
  ['/auditlog', 'Moderation', 'Set the audit log channel and toggle logging.'],
  ['/ticket-manager setup', 'Tickets', 'Set ticket log and transcript channels.'],
  ['/ticket-manager sendpanel', 'Tickets', 'Post a ticket panel in a text channel.'],
  ['/ticket-manager categories create', 'Tickets', 'Create a ticket category with a role and server category.'],
  ['/ticket-manager categories delete', 'Tickets', 'Remove a ticket category.'],
  ['/ticket-manager categories list', 'Tickets', 'List configured ticket categories.'],
  ['/claim', 'Tickets', 'Claim or unclaim the open ticket.'], ['/close', 'Tickets', 'Close the current ticket.'],
  ['/setverification', 'Verification', 'Post captcha verification and configure member roles.'],
  ['/invites', 'Invites', 'Show invite statistics for a member.'], ['/topinvites', 'Invites', 'Show the invite leaderboard.'],
  ['/invitation add', 'Invites', 'Add invites to a member’s count.'], ['/invitation remove', 'Invites', 'Remove invites from a member’s count.'],
  ...['balance', 'crime', 'deposit', 'pay', 'rob', 'topbalance', 'withdraw', 'work'].map(name => [`!${name}`, 'Economy', `Run the ${name} economy command.`]),
  ['/money add', 'Economy', 'Add coins to a member’s balance.'], ['/money remove', 'Economy', 'Remove coins from a member’s balance.'],
  ['/8ball', 'Fun', 'Ask a question and get an 8-ball answer.'], ['/blackjack', 'Fun', 'Play a round of blackjack.'],
  ['/help', 'Utilities', 'Open the interactive Phantom help menu.'], ['!prefix', 'Utilities', 'Show this server’s command prefix.'], ['!setPrefix', 'Utilities', 'Set a server command prefix.']
];
const pageCopy = {
  home: ['Server overview', 'Your Discord server and Phantom tools, together.'], modules: ['All modules', 'Browse the tools available in your Phantom bot.'],
  commands: ['Command library', 'Find the right Phantom command for the job.'], moderation: ['Moderation & logs', 'Choose where Phantom sends server audit events.'],
  tickets: ['Ticket support', 'Configure ticket channels, categories, and panels.'], verification: ['Member verification', 'Set up the captcha welcome flow for your server.'],
  invites: ['Invite tracking', 'Explore the invite commands available to your community.'], economy: ['Server economy', 'Explore economy commands available to your members.'],
  fun: ['Fun & games', 'Explore the games and fun commands in Phantom.'], utility: ['Utilities & help', 'Manage the command prefix and find help.'],
  settings: ['Server settings', 'Configure the bot command prefix for your server.']
};
let me = null;
let guilds = [];
let currentGuildId = localStorage.getItem('phantom.selectedGuild') || '';
let data = null;
let toastTimer;
const $ = selector => document.querySelector(selector);
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const channelOptions = (selected, types = [0]) => (data?.channels || []).filter(channel => types.includes(channel.type)).map(channel => `<option value="${escapeHtml(channel.id)}" ${channel.id === selected ? 'selected' : ''}>${channel.type === 4 ? '▰ ' : '# '}${escapeHtml(channel.name)}</option>`).join('');
const roleOptions = selected => (data?.roles || []).map(role => `<option value="${escapeHtml(role.id)}" ${role.id === selected ? 'selected' : ''}>@ ${escapeHtml(role.name)}</option>`).join('');
const selectField = (label, id, choices, emptyLabel) => `<label class="field"><span>${label}</span><select id="${id}" required><option value="">${emptyLabel}</option>${choices}</select></label>`;
const inputField = (label, id, value, hint = '', attrs = '') => `<label class="field"><span>${label}</span><input id="${id}" value="${escapeHtml(value)}" ${attrs}>${hint ? `<small>${hint}</small>` : ''}</label>`;

function showToast(message, error = false) {
  const toast = $('#toast'); toast.textContent = message; toast.classList.toggle('toast-error', error); toast.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
}

async function api(url, options = {}) {
  const headers = { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.method && options.method !== 'GET' ? { 'X-CSRF-Token': me?.csrfToken || '' } : {}), ...options.headers };
  const response = await fetch(url, { ...options, headers, credentials: 'same-origin' });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || `Request failed (${response.status})`);
  return result;
}

function setAccount() {
  const area = $('#accountArea');
  area.innerHTML = me?.user ? `<span class="server-count">${guilds.length} server${guilds.length === 1 ? '' : 's'}</span>${me.user.avatar ? `<img class="account-avatar" src="${escapeHtml(me.user.avatar)}" alt="">` : '<span class="user-avatar">P</span>'}<span class="user-name">${escapeHtml(me.user.username)}</span><button class="button button-secondary" id="logoutButton">Sign out</button>` : '<a class="button button-secondary" href="/auth/login">Sign in with Discord</a>';
  $('#connectionState').textContent = me?.user ? 'Discord account connected' : 'Sign in to get started';
}

async function boot() {
  me = await api('/api/me'); setAccount();
  if (!me.configured) { renderLogin('The dashboard needs private Discord OAuth, bot, and database settings before sign-in can work. The setup guide is in the repository README.'); return; }
  if (!me.user) { renderLogin('Sign in with Discord to see the servers you manage where Phantom is installed.'); return; }
  const result = await api('/api/guilds'); guilds = result.guilds;
  const picker = $('#guildPicker');
  picker.disabled = !guilds.length;
  $('#serverMembers').textContent = `${guilds.length} server${guilds.length === 1 ? '' : 's'} available to manage`;
  picker.innerHTML = guilds.length ? guilds.map(guild => `<option value="${escapeHtml(guild.id)}">${escapeHtml(guild.name)}</option>`).join('') : '<option value="">No manageable server with Phantom found</option>';
  setAccount();
  if (guilds.length) {
    if (!guilds.some(guild => guild.id === currentGuildId)) currentGuildId = guilds[0].id;
    picker.value = currentGuildId; await selectGuild(currentGuildId);
  } else renderNoGuilds();
}

function renderLogin(message) {
  $('#mainContent').innerHTML = `<section class="login-wrap"><div class="login-card"><span class="brand-mark login-mark">P</span><div class="eyebrow">PHANTOM SERVER DASHBOARD</div><h1>One place for your server tools.</h1><p>${escapeHtml(message)}</p>${me?.configured ? '<a class="button button-primary login-action" href="/auth/login">Continue with Discord <span>↗</span></a>' : '<a class="text-link" href="https://discord.com/developers/applications" target="_blank" rel="noreferrer">Discord developer portal ↗</a>'}<div class="login-note">Only Discord servers where you have Manage Server or Administrator access and Phantom is installed will appear.</div></div></section>`;
}

function renderNoGuilds() {
  data = null; $('#serverName').textContent = 'No available server'; $('#serverMembers').textContent = 'Check bot access'; $('#mainContent').innerHTML = `<div class="page-heading"><div><div class="eyebrow">SERVER CONTROL PANEL</div><h1>Your server tools</h1><p>No server is available to manage yet.</p></div></div><div class="panel empty-server"><div class="panel-title">Add Phantom to a server</div><p>Only servers where you have Manage Server or Administrator permission are eligible. Once Phantom is installed, refresh this list and choose that server to edit its settings.</p>${botInviteLink()} <button class="button button-secondary" id="reloadButton">↻ Refresh server list</button></div>`;
}

function botInviteLink() {
  if (!me?.applicationId) return '';
  const permissions = '268553424';
  const href = `https://discord.com/oauth2/authorize?client_id=${encodeURIComponent(me.applicationId)}&permissions=${permissions}&scope=bot%20applications.commands`;
  return `<a class="button button-primary" href="${href}" target="_blank" rel="noreferrer">Add Phantom to Discord ↗</a>`;
}

async function selectGuild(guildId) {
  if (!guildId) return;
  currentGuildId = guildId; localStorage.setItem('phantom.selectedGuild', guildId); $('#serverName').textContent = guilds.find(item => item.id === guildId)?.name || 'Loading server…';
  try { data = await api(`/api/guilds/${encodeURIComponent(guildId)}`); updateServerBadge(); renderPage(location.hash.slice(1) || 'home'); }
  catch (error) { data = null; $('#mainContent').innerHTML = `<section class="login-wrap"><div class="login-card"><h1>Could not load this server.</h1><p>${escapeHtml(error.message)}</p><button id="reloadButton" class="button button-secondary">Try again</button></div></section>`; }
}

function updateServerBadge() {
  $('#serverName').textContent = data.guild.name;
  $('#serverMembers').textContent = data.guild.memberCount ? `${Number(data.guild.memberCount).toLocaleString()} members` : 'Discord server';
  const icon = $('#serverIcon');
  icon.textContent = data.guild.icon ? '' : data.guild.name.slice(0, 1).toUpperCase();
  icon.style.backgroundImage = data.guild.icon ? `url(https://cdn.discordapp.com/icons/${encodeURIComponent(data.guild.id)}/${encodeURIComponent(data.guild.icon)}.png?size=64)` : '';
}

function shell(page, body) {
  const [title, subtitle] = pageCopy[page] || pageCopy.home;
  return `<div class="page-heading"><div><div class="eyebrow">SERVER CONTROL PANEL</div><h1>${title}</h1><p>${subtitle}</p></div><button class="button button-secondary" id="refreshButton"><span>↻</span> Refresh</button></div>${body}<footer class="page-footer"><span>Phantom <span class="brand-period">✦</span></span><span>Changes apply to <strong>${escapeHtml(data.guild.name)}</strong></span></footer>`;
}

function moduleCard(module) {
  return `<button class="module-card" data-page="${module.id}"><span class="module-icon ${module.tone}">${module.icon}</span><span class="module-info"><strong>${module.name}</strong><small>${module.description}</small></span><span class="module-arrow">${module.live ? '↗' : '⌕'}</span></button>`;
}

function renderHome() {
  const enabledCount = [data.config.audit?.enabled, Boolean(data.config.tickets), Boolean(data.config.verification?.configured)].filter(Boolean).length;
  return `<section class="server-banner"><div class="server-banner-left"><div class="big-server-icon" style="${data.guild.icon ? `background-image:url(https://cdn.discordapp.com/icons/${encodeURIComponent(data.guild.id)}/${encodeURIComponent(data.guild.icon)}.png?size=96)` : ''}">${data.guild.icon ? '' : escapeHtml(data.guild.name.slice(0, 1).toUpperCase())}</div><div><div class="server-title">${escapeHtml(data.guild.name)}</div><div class="server-subtitle"><span class="purple-dot"></span> Your server <span class="bullet">·</span> Prefix <code>${escapeHtml(data.config.prefix)}</code></div></div></div><div class="banner-actions"><span class="connected-chip"><span class="status-dot"></span> Connected</span><button class="button button-primary" data-page="settings">⚙ Server settings</button></div></section>
  <section class="stat-grid"><article class="stat-card"><div class="stat-icon members">♙</div><div><div class="stat-label">Server members</div><strong class="stat-value">${data.guild.memberCount ? Number(data.guild.memberCount).toLocaleString() : '—'}</strong><span class="stat-note">From Discord</span></div></article><article class="stat-card"><div class="stat-icon channels">#</div><div><div class="stat-label">Channels</div><strong class="stat-value">${data.channels.filter(channel => channel.type === 0).length}</strong><span class="stat-note">Text channels</span></div></article><article class="stat-card"><div class="stat-icon roles">♜</div><div><div class="stat-label">Server roles</div><strong class="stat-value">${data.roles.length}</strong><span class="stat-note">Available to Phantom</span></div></article><article class="stat-card"><div class="stat-icon modules">◈</div><div><div class="stat-label">Configured tools</div><strong class="stat-value">${enabledCount} <span class="of-total">/ 3</span></strong><span class="stat-note">Live web controls</span></div></article></section>
  <section class="content-grid"><div class="panel activity-panel"><div class="panel-heading"><div><div class="panel-title"><span class="heading-icon">◷</span> Module configuration</div><div class="panel-description">Current settings for this Discord server.</div></div></div><div class="activity-list">${activityRow('◇', data.config.audit?.enabled ? 'green' : 'blue', 'Audit logging', data.config.audit?.enabled ? `Sending logs to ${channelName(data.config.audit.channelId)}` : 'Not configured', 'moderation')}${activityRow('▤', data.config.tickets ? 'amber' : 'blue', 'Ticket support', data.config.tickets ? `${data.config.tickets.categories.length} categories · logs ${channelName(data.config.tickets.channelLog)}` : 'Not configured', 'tickets')}${activityRow('✓', data.config.verification ? 'violet' : 'blue', 'Verification', data.config.verification ? `Configured in ${channelName(data.config.verification.channelId)}` : 'Not configured', 'verification')}</div></div><div class="right-column"><div class="panel quick-panel"><div class="panel-heading"><div><div class="panel-title">Quick access</div><div class="panel-description">Configure your server tools.</div></div></div><div class="quick-list">${quickLink('◇', 'violet-bg', 'Moderation & logs', 'Choose an audit log channel', 'moderation')}${quickLink('▤', 'amber-bg', 'Ticket configuration', 'Configure support and panels', 'tickets')}${quickLink('✓', 'blue-bg', 'Member verification', 'Set up captcha verification', 'verification')}</div></div><div class="tip-card"><div class="tip-label"><span>✦</span> LIVE SERVER DATA</div><p>Server details and configuration load from Discord and your bot database after sign-in.</p></div></div></section><section class="module-section"><div class="section-heading"><div><h2>Server tools</h2><p>Available Phantom modules for this server.</p></div><button class="text-link" data-page="modules">View all →</button></div><div class="module-grid">${modules.map(moduleCard).join('')}</div></section>`;
}

function channelName(id) { return data.channels.find(channel => channel.id === id)?.name ? `#${data.channels.find(channel => channel.id === id).name}` : 'channel removed'; }
function activityRow(icon, tone, title, description, page) { return `<button class="activity-row activity-button" data-page="${page}"><span class="activity-symbol ${tone}">${icon}</span><span class="activity-copy"><strong>${title}</strong><span>${escapeHtml(description)}</span></span><span class="module-arrow">↗</span></button>`; }
function quickLink(icon, tone, title, hint, page) { return `<button class="quick-item" data-page="${page}"><span class="quick-icon ${tone}">${icon}</span><span><strong>${title}</strong><small>${hint}</small></span><span class="quick-arrow">↗</span></button>`; }

function renderModulePage(page) {
  if (page === 'moderation') return `<div class="panel form-panel"><div class="panel-heading"><div><div class="panel-title">Audit log channel</div><div class="panel-description">Phantom posts supported server audit events in this channel.</div></div><span class="status-pill ${data.config.audit?.enabled ? 'is-on' : ''}">${data.config.audit?.enabled ? 'Enabled' : 'Disabled'}</span></div><form id="auditForm" class="form-body">${selectField('Text channel', 'auditChannel', channelOptions(data.config.audit?.channelId, [0]), 'Choose a text channel')}<label class="toggle-row"><span><strong>Enable audit logging</strong><small>Uses the existing Phantom audit event listener.</small></span><input id="auditEnabled" type="checkbox" ${data.config.audit?.enabled ? 'checked' : ''}><i></i></label><button class="button button-primary" type="submit">Save audit settings</button></form></div>${commandHint('/auditlog')}`;
  if (page === 'settings' || page === 'utility') return `<div class="panel form-panel"><div class="panel-heading"><div><div class="panel-title">Command prefix</div><div class="panel-description">Change the text-command prefix for this server.</div></div></div><form id="prefixForm" class="form-body">${inputField('Prefix', 'prefixInput', data.config.prefix, '1–4 characters. Slash commands are unchanged.', 'maxlength="4" required pattern="[^\\s@<>]{1,4}"')}<button class="button button-primary" type="submit">Save prefix</button></form></div><div class="tip-card" style="margin-top:14px"><div class="tip-label"><span>✦</span> COMMAND LIBRARY</div><p>Browse Phantom commands by module, including ticket setup, invites, economy, and games.</p><button data-page="commands">Browse commands →</button></div>`;
  if (page === 'tickets') {
    const ticket = data.config.tickets;
    const categories = ticket?.categories || [];
    return `<div class="panel form-panel"><div class="panel-heading"><div><div class="panel-title">Ticket channels</div><div class="panel-description">Choose where Phantom saves ticket logs and transcripts.</div></div></div><form id="ticketSetupForm" class="form-body two-fields">${selectField('Ticket log channel', 'ticketLog', channelOptions(ticket?.channelLog, [0]), 'Choose a text channel')}${selectField('Transcript channel', 'ticketTranscript', channelOptions(ticket?.channelTranscript, [0]), 'Choose a text channel')}<button class="button button-primary" type="submit">Save ticket channels</button></form></div><div class="panel form-panel secondary-panel"><div class="panel-heading"><div><div class="panel-title">Ticket categories</div><div class="panel-description">Add up to five categories, each with a staff role and server category.</div></div></div><div class="category-list">${categories.length ? categories.map(category => `<div class="category-row"><span class="category-emoji">${escapeHtml(category.emoji)}</span><span class="category-copy"><strong>${escapeHtml(category.name)}</strong><small>${escapeHtml(category.description)} · @${escapeHtml(data.roles.find(role => role.id === category.role)?.name || 'role removed')}</small></span><button class="danger-link" data-delete-category="${escapeHtml(category.name)}">Remove</button></div>`).join('') : '<div class="empty-inline">No ticket categories yet.</div>'}</div><form id="ticketCategoryForm" class="form-body category-form">${inputField('Category name', 'categoryName', '', '', 'maxlength="45" required')}${inputField('Button emoji', 'categoryEmoji', '🎫', '', 'maxlength="32" required')}${inputField('Member instructions', 'categoryDescription', '', '', 'maxlength="100" required')}${selectField('Button style', 'categoryStyle', '<option value="Primary">Blue</option><option value="Success">Green</option><option value="Danger">Red</option><option value="Secondary">Grey</option>', 'Choose a button style')}${selectField('Support role', 'categoryRole', roleOptions(''), 'Choose a role')}${selectField('Server category', 'categoryChannel', channelOptions('', [4]), 'Choose a category')}<button class="button button-secondary" type="submit" ${categories.length >= 5 ? 'disabled' : ''}>＋ Add category</button></form></div><div class="panel form-panel secondary-panel"><div class="panel-heading"><div><div class="panel-title">Post ticket panel</div><div class="panel-description">Publish a panel with your configured ticket buttons.</div></div></div><form id="ticketPanelForm" class="form-body inline-form">${selectField('Send to text channel', 'panelChannel', channelOptions('', [0]), 'Choose a text channel')}<button class="button button-primary" type="submit" ${categories.length ? '' : 'disabled'}>Post ticket panel</button></form></div>`;
  }
  if (page === 'verification') return `<div class="panel form-panel"><div class="panel-heading"><div><div class="panel-title">Captcha verification</div><div class="panel-description">Post a Verify button and configure which roles Phantom assigns after the captcha.</div></div><span class="status-pill ${data.config.verification ? 'is-on' : ''}">${data.config.verification ? 'Configured' : 'Not configured'}</span></div><form id="verificationForm" class="form-body">${selectField('Verification channel', 'verificationChannel', channelOptions(data.config.verification?.channelId, [0]), 'Choose a text channel')}${inputField('Welcome message', 'verificationMessage', '', 'This message appears above the Verify button. Max 1,800 characters.', 'maxlength="1800" required')}${selectField('Role to add after verification', 'verificationRole', roleOptions(data.config.verification?.addRole), 'Choose a role')}${selectField('Role to remove (optional)', 'verificationRemoveRole', `<option value="">Do not remove a role</option>${roleOptions(data.config.verification?.removeRole)}`, 'Optional')}<div class="inline-notice">Phantom needs permission to send messages and manage the selected roles. Its highest role must be above both selected roles.</div><button class="button button-primary" type="submit">Post verification panel</button></form></div>${commandHint('/setverification')}`;
  return renderInformational(page);
}

function commandHint(command) { return `<div class="tip-card" style="margin-top:14px"><div class="tip-label"><span>✦</span> ALSO AVAILABLE IN DISCORD</div><p>You can configure this module with <code>${command}</code> too.</p><button data-page="commands">Browse commands →</button></div>`; }

function renderModules() { return `<div class="section-heading"><div><h2>Phantom modules</h2><p>Explore tools supported by the bot. Live controls are labelled in each module.</p></div></div><div class="module-grid">${modules.map(moduleCard).join('')}</div>`; }
function renderInformational(page) {
  const module = modules.find(item => item.id === page);
  const moduleCommands = commands.filter(command => command[1].toLowerCase().includes(module?.name.split(' ')[0].toLowerCase() || page));
  const visibleCommands = moduleCommands.length ? moduleCommands : commands.filter(command => module?.commands.some(item => item.toLowerCase() === command[0].toLowerCase()));
  const description = page === 'invites' ? 'Phantom tracks invites in the bot. Use these commands in your server to view invite counts and the leaderboard.' : page === 'economy' ? 'Members can use the economy commands in Discord. Balance and activity are stored by the bot.' : 'These tools are available through Phantom commands in your Discord server.';
  return `<div class="panel info-panel"><div class="module-info"><strong>${module?.name || 'Phantom tools'}</strong><small>${description}</small></div><div class="nav-label command-label">AVAILABLE COMMANDS</div><div class="command-chip-list">${(module?.commands || []).map(command => `<code class="command-pill">${escapeHtml(command)}</code>`).join('')}</div><p class="muted-copy">This module does not have web settings in the current bot. The available Discord commands are listed here for your admins.</p><button class="button button-secondary" data-page="commands">Open command library →</button></div>${visibleCommands.length ? `<div class="panel command-panel" style="margin-top:14px"><div class="panel-heading"><div><div class="panel-title">${module?.name} commands</div></div></div><div class="command-table-wrap"><table class="command-table"><thead><tr><th>COMMAND</th><th>MODULE</th><th>DESCRIPTION</th></tr></thead><tbody>${visibleCommands.map(row => `<tr><td><code class="command-pill">${escapeHtml(row[0])}</code></td><td>${escapeHtml(row[1])}</td><td>${escapeHtml(row[2])}</td></tr>`).join('')}</tbody></table></div></div>` : ''}`;
}

function renderCommands() {
  return `<div class="panel command-panel"><div class="panel-heading"><div><div class="panel-title">Phantom command reference</div><div class="panel-description">Use these commands in a server where Phantom is installed.</div></div></div><div class="search-wrap"><span>⌕</span><input id="commandSearch" type="search" placeholder="Search command, module, or description…" aria-label="Search commands"></div><div class="command-table-wrap"><table class="command-table"><thead><tr><th>COMMAND</th><th>MODULE</th><th>WHAT IT DOES</th></tr></thead><tbody id="commandRows">${commandRows(commands)}</tbody></table><div class="empty-state" id="emptyState" hidden>No commands match your search.</div></div></div>`;
}
function commandRows(rows) { return rows.map(row => `<tr><td><code class="command-pill">${escapeHtml(row[0])}</code></td><td><span class="category-pill">${escapeHtml(row[1])}</span></td><td>${escapeHtml(row[2])}</td></tr>`).join(''); }

function renderPage(page) {
  const selectedPage = pageCopy[page] ? page : 'home';
  document.title = `${pageCopy[selectedPage][0]} · Phantom`;
  document.querySelectorAll('.nav-item').forEach(item => item.classList.toggle('active', item.dataset.page === selectedPage));
  $('#sidebar').classList.remove('open');
  if (!data) return;
  const content = selectedPage === 'home' ? renderHome() : selectedPage === 'modules' ? renderModules() : selectedPage === 'commands' ? renderCommands() : renderModulePage(selectedPage);
  $('#mainContent').innerHTML = shell(selectedPage, content);
  history.replaceState(null, '', `#${selectedPage}`);
}

async function submitForm(event, endpoint, payload) {
  event.preventDefault();
  const button = event.submitter; if (button) { button.disabled = true; button.dataset.label = button.textContent; button.textContent = 'Saving…'; }
  try { const result = await api(`/api/guilds/${encodeURIComponent(currentGuildId)}/${endpoint}`, { method: endpoint === 'tickets' && payload.action ? 'POST' : 'PATCH', body: JSON.stringify(payload) }); showToast(result.message || 'Changes saved.'); await selectGuild(currentGuildId); }
  catch (error) { showToast(error.message, true); }
  finally { if (button?.isConnected) { button.disabled = false; button.textContent = button.dataset.label || 'Save'; } }
}

document.addEventListener('click', async event => {
  const pageLink = event.target.closest('[data-page]');
  if (pageLink) { event.preventDefault(); renderPage(pageLink.dataset.page); return; }
  if (event.target.closest('#menuToggle')) { $('#sidebar').classList.toggle('open'); return; }
  if (event.target.closest('#reloadButton')) { await boot(); return; }
  if (event.target.closest('#refreshButton')) { await selectGuild(currentGuildId); return; }
  if (event.target.closest('#logoutButton')) { try { await api('/auth/logout', { method: 'POST', body: '{}' }); } catch {} location.assign('/'); return; }
  const deleteCategory = event.target.closest('[data-delete-category]');
  if (deleteCategory && confirm(`Remove the “${deleteCategory.dataset.deleteCategory}” ticket category?`)) {
    try { const result = await api(`/api/guilds/${encodeURIComponent(currentGuildId)}/tickets`, { method: 'POST', body: JSON.stringify({ action: 'delete-category', name: deleteCategory.dataset.deleteCategory }) }); showToast(result.message); await selectGuild(currentGuildId); }
    catch (error) { showToast(error.message, true); }
  }
});

document.addEventListener('change', event => { if (event.target.id === 'guildPicker') selectGuild(event.target.value); });
document.addEventListener('input', event => {
  if (event.target.id !== 'commandSearch') return;
  const query = event.target.value.trim().toLowerCase(); const rows = commands.filter(row => row.join(' ').toLowerCase().includes(query));
  $('#commandRows').innerHTML = commandRows(rows); $('#emptyState').hidden = rows.length > 0;
});
document.addEventListener('submit', event => {
  const id = event.target.id;
  if (id === 'prefixForm') return submitForm(event, 'prefix', { prefix: $('#prefixInput').value });
  if (id === 'auditForm') return submitForm(event, 'audit-log', { channelId: $('#auditChannel').value, enabled: $('#auditEnabled').checked });
  if (id === 'ticketSetupForm') return submitForm(event, 'tickets', { channelLog: $('#ticketLog').value, channelTranscript: $('#ticketTranscript').value });
  if (id === 'ticketCategoryForm') return submitForm(event, 'tickets', { action: 'category', name: $('#categoryName').value, emoji: $('#categoryEmoji').value, description: $('#categoryDescription').value, style: $('#categoryStyle').value, roleId: $('#categoryRole').value, channelId: $('#categoryChannel').value });
  if (id === 'ticketPanelForm') return submitForm(event, 'tickets', { action: 'send-panel', channelId: $('#panelChannel').value });
  if (id === 'verificationForm') return submitForm(event, 'verification', { channelId: $('#verificationChannel').value, addRole: $('#verificationRole').value, removeRole: $('#verificationRemoveRole').value, message: $('#verificationMessage').value });
});

boot().catch(error => { renderLogin(error.message); });
