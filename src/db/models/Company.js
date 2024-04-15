const { Schema, model } = require("mongoose");

const CompanySchema = new Schema({
    // Files
    ruc_file: String,
    economic_activity: String,
    validity: String,
    number: String,
    cellphone: String,
    telephone: String,
    email: String,
    commercial_name: String,
    size: String,
    obligated_subject: String,
    commercial_address: String,
    business_address: String,
    department: String,
    province: String,
    district: String,
    constitucion: Date,
    users: [{ type: Schema.Types.ObjectId, ref: "user" }],
    operations: [
        {
            id: { type: Schema.Types.ObjectId, ref: "operation" },
            user: { type: Schema.Types.ObjectId, ref: "user" },
            created_at: { type: Date, default: Date.now },
        },
    ],
    bank_accounts: [
        {
            account: String,
            doc: String,
            doc_number: String,
            fullname: String,
            code: String,
            name: String,
            number: String,
            cci: String,
            account_type: String,
            currency: String,
            description: String,
        },
    ],
    special_service: {
        sp_compra: Number,
        sp_venta: Number,
    },
    is_active: { type: Boolean, default: true },
    is_contraparte: { type: Boolean },
    created_at: { type: Date, default: Date.now },
});

module.exports = model('company', CompanySchema);