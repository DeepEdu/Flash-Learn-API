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
 
// update Question in Question Collection
questionRoute.route("/update-question/:id").put((req, res, next) => {
  question.findOneAndUpdate( 
    req.params.id,
    { 
      $set: req.body
    },
    (error, data) => {
      if (error) {
        console.log(error);
        return next(error);
      } else {
        console.log("Question updated successfully!");
        res.json(data);
      }
    }
  );
});

module.exports = questionRoute;