const mongoose = require("mongoose");

const { Schema, model } = mongoose;

const CredentialSchema = new Schema({
    key: String,
    token: String,
    update_on: Date,
});
module.exports = model("credential", CredentialSchema);