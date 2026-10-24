const { Schema, model } = require('mongoose');

const verificationSchema = new Schema({
  guildId: { type: String, required: true },
  addRole: {  type: String, required: true },
  removeRole: {  type: String },
  channelId: { type: String,  required: true },
  messageId: { type: String, required: true }
}); 

module.exports = model('Verification', verificationSchema);