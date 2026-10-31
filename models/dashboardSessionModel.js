const { Schema, model, models } = require('mongoose');

const dashboardSessionSchema = new Schema({
  keyHash: { type: String, required: true, unique: true },
  data: { type: Schema.Types.Mixed, required: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
}, { timestamps: true });

module.exports = models.dashboardSession || model('dashboardSession', dashboardSessionSchema);
