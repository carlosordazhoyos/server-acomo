const mongoose = require("mongoose");
// const mongoosePaginate = require("mongoose-paginate-v2");
// const mongooseAggregatePaginate = require("mongoose-aggregate-paginate-v2");

const { Schema, model } = mongoose;

const OperationSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "user" },
  voucher: { type: Schema.Types.ObjectId, ref: "voucher" },
  allVouchers: [
    {
      idVo: { type: Schema.Types.ObjectId, ref: "voucher" },
      serie: String,
      status: String,
      isNote: Boolean,
      refSerie: String,
      overrideCode: String,
      created_at: { type: Date, default: Date.now },
    },
  ],
  code: String,
  action: String,
  destiny_bank: String,
  account_type: String,
  pay_mode: String,
  to_card: String,
  to_account: String,
  to_doc: String,
  to_acc_number: String,
  to_number: String,
  to_cci: String,
  to_name: String,
  source_money: String,
  origin_bank: String,
  is_origin_interbank: Boolean,
  status: { type: String, default: "0" },
  end_of_transaction: Date,
  amount: Number,
  op_code: String,
  // Tipo de cambio
  change: Number,
  sp_compra: Number,
  sp_venta: Number,
  BID: Number,
  OFFER: Number,
  ranges: [
    {
      importe: Number,
      spCompra: Number,
      spVenta: Number,
      BID: Number,
      OFFER: Number,
    },
  ],
  special_service: {
    sp_compra: Number,
    sp_venta: Number,
  },
  // ranges[amount] = final_rate(BID o OFFER)
  final_rate: Number,
  // De otra web
  to_compare: {
    BID: Number,
    OFFER: Number,
  },
  compare: Number,
  promo: {
    id: { type: Schema.Types.ObjectId, ref: "promo" },
    sp_compra: Number,
    sp_venta: Number,
  },
  min_buy: Number,
  max_buy: Number,
  min_sell: Number,
  max_sell: Number,
  proof: String, // enviar correo, archivo
  proof_URL: String,
  reactivated_at: Date,
  is_contraparte: { type: Boolean, default: false },
  transac_contraparte: [
    {
      to_cci: String,
      origin_bank: String,
      origin_import: Number,
      destiny_bank: String,
      destiny_import: Number,
      contraparte_bank: String,
      account_type: String,
      to_acc_number: String,
      is_origin_interbank: Boolean,
      min_buy: Number,
      max_buy: Number,
      min_sell: Number,
      max_sell: Number,
    },
  ],
  tc_manual: Number,
  created_at: { type: Date, default: Date.now },
  pre_created_at: Date
});

// OperationSchema.plugin(mongoosePaginate);
// OperationSchema.plugin(mongooseAggregatePaginate);

module.exports = model("operation", OperationSchema);
