import mongoose from "mongoose";
const Schema = mongoose.Schema;

let masterSchema = new Schema(
  {
    companyname: {
      type: String,
    },
    add1: {
      type: String,
    },
    add2: {
      type: String,
    },
    contact: {
      type: String,
    },
    keyid: {
      type: String,
    },
    keysecret: {
      type: String,
    },
    charges: {
      type: Number,
    },
  },
  {
    collection: "master",
  }
);

export default mongoose.model("Master", masterSchema);
