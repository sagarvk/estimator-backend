import Quality from "../models/Quality.js"
import Desp from "../models/Desp.js"
import Client from "../models/Client.js"

let contigency=2.5, electrification=2.5;


export const getAmt = async(req,res,next)=>{
    const {customerName,address,plotLength,plotWidth,totalBuiltupArea,floors,projectType,constructionQuality,mobileNo,mailId} = req.body;
    let qData, despdetails, conrate, eamt, tamt, camount, eamount;
    let estimatecalc = [];
    let desptable = [];
    let barea = parseInt(totalBuiltupArea);
    try{
        qData = await Quality.findOne({"name": constructionQuality});
    } catch(err){
        console.log(err)
    }
    if(!qData){
        return res.status(404).json({message:"No Data Found"});
    } else{

        conrate = qData.rate
        eamt = conrate * barea;
        camount = eamt * (contigency/100)
        eamount = eamt * (electrification/100)
        tamt = eamt + camount + eamount
        try{
            despdetails = await Desp.find({"category": projectType});
        } catch(err){
            console.log(err)
        }
        if(!despdetails){
            return res.status(404).json({message:"No Data Found"});
        } else{
            let sno = 0
            estimatecalc =  despdetails.map( (el)=>{
                sno+=1;
                let qtyc = (eamt*(el.percent/100))/el.rate;
                let amtc = (eamt*(el.percent/100))
                let row = {
                    "sr.no": sno,
                    "desp":el.desp,
                    "qty": qtyc.toFixed(2),
                    "rate":el.rate.toFixed(2),
                    "unit":el.unit,
                    "amount":amtc.toFixed(2)
                }
                return row;
            })
            
            // desptable.push(estimatecalc)
            estimatecalc.push({
                "sr.no":sno+1,
                "desp": `Add for Contengencies & Water Charges at ${contigency.toFixed(2)}%`,
                "qty":"",
                "rate":"",
                "unit":"",
                "amount":camount
             },
             {
                "sr.no":sno+2,
                "desp": `Add for Electrification & Other Charges at ${electrification.toFixed(2)}%`,
                "qty":"",
                "rate":"",
                "unit":"",
                "amount":eamount
             })

             res.status(200).json({success:  true, data: estimatecalc})
        }
    }
   
   
}

const getRates = async(req,res,next)=>{
    const constructionQuality = req.body.constructionQuality;
    let qData;
    try{
        qData = await Quality.findOne({"name": constructionQuality});
    } catch(err){
        console.log(err)
    }
    if(!qData){
        return res.status(404).json({message:"No Data Found"});
    }
    return res.status(200).json({success:  true, data: qData.rate})
}

export const getAllData = async(req, res, next)=>{
    const {customerName,address,plotLength,plotWidth,totalBuiltupArea,floors,projectType,constructionQuality,mobileNo,mailId} = req.body;
    let qData;
    try{
        qData = await Quality.find({});
    } catch(err){
        console.log(err)
    }
    if(!qData){
        return res.status(404).json({message:"No Data Found"});
    }
    return res.status(200).json({success:  true, data: qData})
}