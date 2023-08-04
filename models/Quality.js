import mongoose from "mongoose";
const Schema = mongoose.Schema;

let qualitySchema = new Schema(
  {
    name: {
      type: String,
    },
    rate: {
      type: Number,
    },
    ptype: {
      type: String,
    },
  },
  {
    collection: "quality",
  }
);

export default mongoose.model("Quality", qualitySchema);
