const express = require("express");
const uuid = require("Uuid");

const questionRoute = express.Router();

let question = require("../model/question");
let quiz = require("../model/quiz");
let distribution = require("../model/distribution");


//Add Questions to questionDB
questionRoute.route("/question").post((req, res, next) => {
    /* Generate Unique Id for current Question */
    var quesId = uuid.v4();
    let UserId = req.body.userId;
  
    // Add Current Question to Question Collection
    res.json(addToQuestionCollection(quesId, req));
    
    // Add Current Question to Quiz Collection
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
          console.log("Failed to Cannot create quiz document"+error);
          return (next(error));
        }
      }
    );
  }
  function addToQuestionCollection(quesId, req){
    var newQuestion = {
      questionId: quesId,
      ques: req.body.ques,
      ans: req.body.ans
    }
    return question.create(newQuestion, (error) => {
      if (error) {
        console.log("Failed to create question document"+error);
        return next(error);
      }
    });
  }

  function addToDistributionCollection(UserId,next){
    distribution.countDocuments({userId: UserId}, function (error, count){ 
      if(count==0){
        distribution.create({userId:  UserId}, (error) => {
          if (error) {
            console.log("Error: userId not found"+error);
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
          console.log("Failed to update document"+error);
          return next(error);
        }
  })
} 
 
// update Question in Question Collection
questionRoute.route("/question/:id").put((req, res, next) => {
  question.findOneAndUpdate( req.params.id, 
    { 
      ques: req.body.ques,
      ans: req.body.ans
    },
    (error, theQuestions) => {
      if (error) {
        console.log("Failed to find and update::"+error);
        return next(error);
      } else {
        console.log("Question updated successfully!");
        res.json(schemaForQuiz(theQuestions));
      }
    }
  );
});

function schemaForQuiz(theQuestion){
  return (
    {
      questionId: theQuestion.questionId,
      ques: theQuestion.ques,
      ans: theQuestion.ans
    }); 
}

module.exports = questionRoute;