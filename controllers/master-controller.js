import master from "../models/Master.js";

export const getAllData = async (req, res, next) => {
  let qData;
  try {
    qData = await master.find({});
  } catch (err) {
    console.log(err);
  }
  if (!qData) {
    return res.status(404).json({ message: "No Data Found" });
  }
  return res.status(200).json({ success: true, data: qData });
};
export const getAllDataFE = async (req, res, next) => {
  let qData;
  try {
    qData = await master.find(
      {},
      {
        keysecret: 0,
        smtpclient: 0,
        user: 0,
        pass: 0,
        add1: 0,
        add2: 0,
        contact: 0,
      }
    );
  } catch (err) {
    console.log(err);
  }
  if (!qData) {
    return res.status(404).json({ message: "No Data Found" });
  }
  return res.status(200).json({ success: true, data: qData });
};
