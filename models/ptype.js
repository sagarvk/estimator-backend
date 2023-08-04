import mongoose from "mongoose";
const Schema = mongoose.Schema;

let ptypeSchema = new Schema(
  {
    pname: {
      type: String,
    },
    pdesp: {
      type: String,
    },
  },
  {
    collection: "ptype",
  }
);

export default mongoose.model("Ptype", qualitySchema);
