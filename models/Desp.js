import mongoose from "mongoose";
const Schema = mongoose.Schema;

let despSchema = new Schema({
desp: {
	type: String
},
rate: {
	type: Number
},
unit: {
	type: String
},
category: {
	type: String
},
percent: {
	type: Number
}
}, {
	collection: 'desp'
})

export default mongoose.model('Desp', despSchema)
