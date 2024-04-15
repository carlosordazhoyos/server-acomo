const mongoose = require("mongoose");

const { Schema, model } = mongoose;

const BillSerieSchema = new Schema({
  doc_type: String,
  serie: String,
  number: Number,
  comment: String,
});

module.exports = model("billserie", BillSerieSchema);
