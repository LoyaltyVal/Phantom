const verificationModel = require('../models/verification.js')

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    const verificationData = await verificationModel.find()
    
    verificationData.map(async (data) => {
      client.guilds.fetch(data.guildId)
        .then(guild => {
          guild.channels.fetch(data.channelId)
            .then(ch => {
              ch.messages.fetch(data.messageId)
                .then(message => {})
                .catch(e => {})
            })
            .catch(er => {})
        })
        .catch(err => {})
    })
  }
}