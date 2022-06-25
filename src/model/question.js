const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let questions = new Schema({
  ques: {
    type: String,
    required: true
  },
  ans: {
    type: String,
    required: true
  },
  questionId: {
    type: String,
    required: true
  },
}, {
  collection: 'questions'
})
module.exports = mongoose.model('questions', questions)