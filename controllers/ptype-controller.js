import ptype from "../models/Ptype.js";

export const getAllData = async (req, res, next) => {
  let qData;
  try {
    qData = await ptype.find({});
  } catch (err) {
    console.log(err);
  }
  if (!qData) {
    return res.status(404).json({ message: "No Data Found" });
  }
  return res.status(200).json({ success: true, data: qData });
};
