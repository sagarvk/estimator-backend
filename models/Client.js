import mongoose from "mongoose";
const Schema = mongoose.Schema;

let clientSchema = new Schema(
  {
    cname: {
      type: String,
    },
    add: {
      type: String,
    },
    state: {
      type: String,
    },
    length: {
      type: Number,
    },
    width: {
      type: Number,
    },
    area: {
      type: Number,
    },
    floors: {
      type: Number,
    },
    ptype: {
      type: String,
    },
    quality: {
      type: String,
    },
    mobile: {
      type: Number,
    },
    mail: {
      type: String,
    },
    order_id: {
      type: String,
    },
    payment_id: {
      type: String,
    },
    fees: {
      type: Number,
    },
    pstatus: {
      type: String,
    },
    pid: {
      type: String,
    },
  },
  {
    collection: "client",
  },
  { timestamps: true }
);

export default mongoose.model("Client", clientSchema);
