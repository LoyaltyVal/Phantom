const { GatewayIntentBits, Partials} = require('discord.js')

module.exports = {
  botConfig: {
    allowedMentions: { parse: ['users', 'roles'] },
    intents: [
      Object.keys(GatewayIntentBits)
    ],
    partials: [Object.keys(Partials)]
  },
};
