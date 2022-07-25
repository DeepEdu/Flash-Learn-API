const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let distribution = new Schema({
  userId: {
    type: String,
    required: true
    },    
  RangeMin: {
    type: Number,
    default:0
  },
  RangeMax: {
    type: Number,
    default:1
  },
  countQuestion:{
    type:Number,
    default: 1
  },
}, {
  collection: 'distribution'
})
module.exports = mongoose.model('distribution', distribution)