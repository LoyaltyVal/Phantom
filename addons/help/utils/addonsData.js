const { EmbedBuilder } = require('discord.js');

const categories = [
  { 
    emoji: '✔️', 
    label: 'Verification', 
    description: 'Commands related to user verification.', 
    value: 'verification' 
  },
  { 
    emoji: '👤', 
    label: 'Invitations', 
    description: 'Commands related to managing and tracking invitations.', 
    value: 'Invite' 
  },
  { 
    emoji: '💰', 
    label: 'Economy', 
    description: 'Commands related to managing and tracking economy-related activities.', 
    value: 'Economy'
  },
  { 
    emoji: '🎫', 
    label: 'Tickets', 
    description: 'Commands related to managing tickets.', 
    value: 'tickets'
  },
  { 
    emoji: '🎮', 
    label: 'Fun', 
    description: 'Commands related to playing, playing games, and having fun in the server.', 
    value: 'Fun'
  },
  { 
    emoji: '🛡️', 
    label: 'Moderation', 
    description: 'Commands related to server moderation.', 
    value: 'moderation'
  },
  { 
    emoji: '❓', 
    label: 'Utils', 
    description: 'Displays utils-related commands.', 
    value: 'utils'
  }
];

const embedsCategories = {
  verification: new EmbedBuilder()
    .setTitle('Verification Commands')
    .setDescription('List of commands for setting up and managing user verification.')
    .setColor('Blue')
    .addFields(
      { name: '/setVerification', value: 'Configure the verification system with a captcha and assign roles.' }
    ),
  Invite: new EmbedBuilder()
    .setTitle('Invitation Commands')
    .setDescription('List of commands for managing and tracking invitations in the server.')
    .setColor('Green')
    .addFields(
      { name: '/invites', value: 'Displays the number of invites a user has.' },
      { name: '/topInvites', value: 'Displays the top users with the most invites.' },
      { name: '/invitation', value: 'Manage invitation amount for users.' }
    ),
  Economy: new EmbedBuilder()
    .setTitle('Economy Commands')
    .setDescription('List of commands for managing and tracking economy-related activities.')
    .setColor('Gold')
    .addFields(
      { name: '!balance', value: 'Check your balance' },
      { name: '!crime', value: 'Simulates a crime scene' },
      { name: '!deposit', value: 'Deposits money into your bank account' },
      { name: '!pay', value: 'Pay a user with a specified amount' },
      { name: '!rob', value: 'Attempt to rob a user' },
      { name: '!topbalance', value: 'Shows the top 10 players with the highest balance' },
      { name: '!withdraw', value: 'Withdraw money from your balance' },
      { name: '!work', value: 'This command is used to work' },
      { name: 'money', value: 'Manage your economy' }
    ),
  tickets: new EmbedBuilder()
    .setTitle('Ticket Commands')
    .setDescription('List of commands for managing tickets in the server.')
    .setColor('Purple')
    .addFields(
      { name: '/claim', value: 'Claim or unclaim a ticket.' },
      { name: '/close', value: 'Close the ticket.' },
      { name: '/ticket-manager', value: 'Manage tickets for your server.' }
    ),
  Fun: new EmbedBuilder()
    .setTitle('Fun Commands')
    .setDescription('List of commands for playing, playing games, and having fun in the server.')
    .setColor('Red')
    .addFields(
      { name: '/8ball', value: 'Ask the 8ball and get an answer' }
    ),
  moderation: new EmbedBuilder()
    .setTitle('Moderation Commands')
    .setDescription('List of commands for server moderation.')
    .setColor('DarkRed')
    .addFields(
      { name: '/auditlog', value: 'Configure the audit log channel' }
    ),
  utils: new EmbedBuilder()
    .setTitle('Utils Commands')
    .setDescription('List of commands for displaying utils menus and information.')
    .setColor('DarkBlue')
    .addFields(
      { name: '!prefix', value: 'Displays the current prefix' },
      { name: '!setPrefix', value: 'Sets the prefix for the bot' },
      { name: '/help', value: 'Displays a help menu with options to explore commands interactively.' }
    )
};

module.exports = {
  categories,
  embedsCategories,
};