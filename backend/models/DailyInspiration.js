const mongoose = require('mongoose');

const recipeItemSchema = new mongoose.Schema({
  title: String,
  description: String,
  emoji: String,
  type: String,
  time: String,
  color: String,
  ingredients: [String],
  steps: [String],
  imageUrl: String
}, { _id: false });

const dailyInspirationSchema = new mongoose.Schema({
  date: { type: Date, required: true, unique: true, index: true },
  recipes: [recipeItemSchema],
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('DailyInspiration', dailyInspirationSchema);
