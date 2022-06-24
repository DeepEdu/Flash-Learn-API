const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let distribution = new Schema({
  userId: {
    type: String,
    required: true
    },    
  RangeMin: {
    type: String,
    default:1
  },
  RangeMax: {
    type: String,
    default:1
  },
  countQuestion:{
    type:String,
    default: 0
  },
}, {
  collection: 'distribution'
})
module.exports = mongoose.model('distribution', distribution)