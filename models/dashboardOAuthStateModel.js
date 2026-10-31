const { Schema, model, models } = require('mongoose');

const dashboardOAuthStateSchema = new Schema({
  stateHash: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
}, { timestamps: true });

module.exports = models.dashboardOAuthState || model('dashboardOAuthState', dashboardOAuthStateSchema);
