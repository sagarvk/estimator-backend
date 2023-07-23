import Client from "../models/Client.js"



export const getAllClient = async(req, res, next)=>{
    let qData;
    try{
        qData = await Client.find();
    } catch(err){
        console.log(err)
    }
    if(!qData){
        return res.status(404).json({message:"No Data Found"});
    }
    return res.status(200).json({success:  true, data: qData})
}
export const addclient = async(req,res,next)=>{
    const {cname,add,length,width,area,floors,ptype,quality,mobile,mail,fees} = req.body;

    const client = new Client({
        cname,
        add,
        length,
        width,
        area,
        floors,
        ptype,
        quality,
        mobile,
        mail,
        fees
    });

    try {
       await client.save();
    } catch (err) {
        console.log(err);
    }
    return res.status(201).json({success:  true, data: qData})
}