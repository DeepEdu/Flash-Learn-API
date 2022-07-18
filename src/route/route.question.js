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

// Delete Questions from Db
questionRoute.route("/question/:id").delete((req, res) => {
  var qId = req.params.id;
  var usrId = req.body.userId;
  // Decrement total numberof Question for the Range of expertiselevel in  Distribution Collection
  updateDistribution(qId,usrId);

  // Deleting Question from the Quiz Collections
  deleteFromQuiz(qId,usrId);

  // Deleting From Question Collection
  deleteFromQuestion(qId);
  res.json("Question Deleted Successfully " + qId);
})

// function to delete from Question Collection
function deleteFromQuestion(qId){
  question.deleteOne({questionId : qId}, (error,next) => {
    if (error) {
      console.log(error);
      return next(error);
    }else{
      console.log("Question with QuesId { " + qId + " }deleted Successfully from Question Collection  ");
    }
  })
}

// function to decrement total number of question from Distribution Collection
function updateDistribution(qId, usrId){
  quiz.findOne( {UserId: usrId, quesId : qId} ,(error, data, next) => {
    if (error) {
      console.log(error);
      return next(error);
    }
    else {
      let x = data.expertiseLevel;
      distribution.findOneAndUpdate({ "userId": data.userId, "RangeMin" : {$lt: x}, "RangeMax" : {$gte : x} }, 
        { 
            $inc : {'countQuestion' : -1} 
        }, 
        (error, countQue) => {
        if (error){
          console.log(error);
          return next(error);
        }
        else if(countQue.countQuestion <= 0){
          console.log("Error: Total number of Question is negative:: "+ countQue.countQuestion);
          return next(error);
        }
        else{
          console.log("After updation Value of CountQuestion is:" + countQue.countQuestion);
        }
      })          
    }
  })
}

// function to delete from Quiz Collection
function deleteFromQuiz(qId,usrId){
  quiz.deleteOne({userId: usrId, quesId : qId}, (error) => {
    if (error) {
      console.log(error);
      return next(error);
    }else{
      console.log("Question deleted Successfully from Quiz Collection");
    }
  })
}

module.exports = questionRoute;