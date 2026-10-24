const { Schema, model } = require('mongoose');

const inviteSchema = new Schema({
  guildId: { type: String, required: true },
  userId: { type: String, required: true },
  inviteJoinedCount: { type: Number, default: 0 },
  inviteLeaveCount: { type: Number, default: 0 },
  inviteFakeCount: { type: Number, default: 0 },
  inviteTotal: { type: Number, default: 0 },
  invitedUsers: { type: [String], default: [] }
})

module.exports = model('invites', inviteSchema)