const mongoose = require('mongoose');

const quoteSchema = new mongoose.Schema({
    id: Number,
    quotes: String
});

const Quote = mongoose.model('quote', quoteSchema);

module.exports = Quote;