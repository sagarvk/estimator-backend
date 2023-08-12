import Client from "../models/Client.js";

export const getAllClient = async (req, res, next) => {
  let qData;
  try {
    qData = await Client.find();
  } catch (err) {
    console.log(err);
  }
  if (!qData) {
    return res.status(404).json({ message: "No Data Found" });
  }
  return res.status(200).json({ success: true, data: qData });
};
export const addclient = async (req, res, next) => {
  const {
    customerName,
    address,
    plotLength,
    plotWidth,
    totalBuiltupArea,
    numOfFloors,
    projectType,
    constructionQuality,
    mobileNo,
    mailId,
  } = req.body.formData;

  let order_id = req.body.response.razorpay_order_id;
  let pay_id = req.body.response.razorpay_payment_id;
  let pay_amount = Number(req.body.pay_amt) / 100;
  let message = "payment successful";

  const client = new Client({
    cname: customerName,
    add: address,
    // state: cstate
    length: plotLength,
    width: plotWidth,
    area: totalBuiltupArea,
    floors: numOfFloors,
    ptype: projectType,
    quality: constructionQuality,
    mobile: mobileNo,
    mail: mailId,
    order_id: order_id,
    payment_id: pay_id,
    fees: pay_amount,
    pstatus: message,
  });

  try {
    await client.save();
  } catch (err) {
    console.log(err);
  }
  return res.status(201).json({ success: true, message: "client saved" });
};
