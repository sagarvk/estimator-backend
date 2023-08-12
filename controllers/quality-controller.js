import quality from "../models/Quality.js";

export const getAllData = async (req, res, next) => {
  let qData;
  let prjType = req.body.projectType;
  // ptype: prjType
  try {
    qData = await quality.find({ ptype: prjType });
  } catch (err) {
    console.log(err);
  }
  if (!qData) {
    return res.status(404).json({ message: "No Data Found" });
  }
  return res.status(200).json({ success: true, data: qData });
};
