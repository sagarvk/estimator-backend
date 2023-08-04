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
    fees: {
      type: Number,
    },
    pid: {
      type: String,
    },
  },
  {
    collection: "client",
  }
);

export default mongoose.model("Client", clientSchema);
