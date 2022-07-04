const express = require("express");
const uuid = require("Uuid");

const questionRoute = express.Router();

let question = require("../model/question");
let quiz = require("../model/quiz");
let distribution = require("../model/distribution");


//Add Questions to questionDB
questionRoute.route("/add-question").post((req, res, next) => {
    /* Generate Unique Id for current Question */
    var quesId = uuid.v4();
    
    // Add Current Question to Question Collection
    res.json(addToQuestionCollection(quesId, req));
    
    // Add Current Question to Quiz Collection
    let UserId = req.body.userId;
    addToQuizCollection(quesId,UserId);
    
    // Add Current Question to Distribution Collection
    addToDistributionCollection(UserId,next);
  });
  
  function addToQuizCollection(qId, UserId) {
    quiz.create(
      {
        quesId: qId,
        userId: UserId
      },
      (error) => {
        if (error) {
          console.log(error);
          return (next(error));
        }
      }
    );
  }
  function addToQuestionCollection(quesId, req){
    var newQuestion = {
      questionId: quesId,
      ...req.body
    }
    return question.create(newQuestion, (error) => {
      if (error) {
        console.log(error);
        return next(error);
      }
    });
  }
  function addToDistributionCollection(UserId,next){
    distribution.countDocuments({userId: UserId}, function (error, count){ 
      if(count==0){
        distribution.create({userId:UserId}, (error) => {
          if (error) {
            console.log(error);
            return next(error);
          } 
        })
        }
    }); 
    distribution.findOneAndUpdate({ userId :UserId, RangeMax: 1,RangeMin: 1 }, 
      { 
        $inc : {'countQuestion' : 1}
      },(error) => {
        if (error) {
          console.log(error);
          return next(error);
        }
      })
  }  

  // Get all Question of the User
  questionRoute.route("/question/get").get(async (req, res) => {
    const arr = [];
    quiz.find( {userId : req.body.userId} )
    .then(async (data) => {
        for(let i =0; i< data.length; i++){
          let y = data[i].quesId;
          let q = await inQuestion(y);
          arr.push(q);
        }
        res.json(arr);
      })
  });
  
  // function to find question from Question Collection
  async function inQuestion(y){
    return question.find( {questionId : y})
    .then((data) => {
      return data;
    });
  }

  // Get Question By Id
  questionRoute.route("/question/get/:id").get((req, res, next) => {
    question.findById(req.params.id, (error, data) => {
      if (error) {
        console.log(error)
        return next(error);
      } else {
        res.json(data);
      }
    });
  });
  
  module.exports = questionRoute;