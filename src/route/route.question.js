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
  questionRoute.route("/question").get(async (req, res) => {
    const arr = [];
    quiz.find( {userId : req.body.userId} )
    .then(async (data) => {
        for(let i =0; i< data.length; i++){
          let qId = data[i].quesId;
          arr.push(await findOneQuestionDetail(qId));
        }
        res.json(arr);
      })
  });
  

  // Get Question By Id
  questionRoute.route("/question/:id").get(async (req, res, next) => {
    let qId = req.params.id;
    var quesDetail =  await findOneQuestionDetail(qId);
    res.json( schema(quesDetail) );
  });
  
  // Function for  schema to be send 
  function schema(theQuestion){
    return (
      {
        QuestionId:theQuestion.questionId,
        Question: theQuestion.ques,
        Answer: theQuestion.ans
      }); 
  }

  // Function to find Question Details
  async function findOneQuestionDetail(quesId){
    return question.findOne({questionId: quesId})
    .then( ( data) => {
      return data;
    })
    .catch(error => res.status(404).send("Question Id not found"))
  }
  module.exports = questionRoute;