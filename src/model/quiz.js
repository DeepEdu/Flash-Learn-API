const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let quiz = new Schema({
  questionId: {
    type: String
  },
  userId: {
    type: String
  },
  expertiseLevel:{
    type:Number,
    default:1
  },
}, {
  collection: 'quiz'
})
module.exports = mongoose.model('quiz', quiz)