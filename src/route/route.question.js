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

  // Get Quiz Question 
  questionRoute.route("/question/quiz/get").get(async (req, res, next) => {
    var usrId = req.body.userId;
    // quizQuestionCount is total question to be taken in Quiz
    var quizQuestionCount = req.body.count;
    const quizList = [];
    distribution
    .find({userId: usrId},(error,data) => {
      if(error){
        console.log(error);
        return next(error);
      }
      else{
        // Function to find total number of Question of the user
        console.log("Range of the user are " + data);
        var totalQuestion =  totalNumberOfQuestion(data);

        for(let i =0; i<data.length; i++){

          // Equity is total Question from each Range to be in Quiz
          let equity = (data[i].countQuestion*quizQuestionCount)/totalQuestion;
          const temp = data[i];
          // Rounding Off equity to get the Question
          equity = Math.round(equity);
          // Find QuestionId of the Question which are in the given range
          quiz
          .find({'userId': usrId, 'expertiseLevel' :{ $gt : temp.RangeMin, $lte: temp.RangeMax} })
          .limit(equity)
          .then(async(quizQuestion) => {
            for (let i = 0; i < quizQuestion.length; i++) {
              let qesId = quizQuestion[i].quesId;
              // To find all Question with the given question Id
              var theQuestion = await inQuestionCollection(qesId);
              // pushing Question to QuizList
              quizList.push(
                {
                  QuestionId:theQuestion.questionId,
                  Question: theQuestion.ques,
                  Answer: theQuestion.ans
                }); 
                // if total Question length is greater then the quizQuestionCount 
                if(quizList.length == quizQuestionCount){
                  console.log(" QuizList Length is:"+ quizList.length);
                 res.json(quizList);  
                 return;
                }
              }
            })
          }
        }
      })
    });

  // function to find Total number of Question in
  function totalNumberOfQuestion(data){
    var totalSum =0;
    for(let i =0; i< data.length; i++){
      totalSum += data[i].countQuestion;
    }
    return totalSum;
  }
  
  // function to find the Question from Qid in the Question Collection
  async function inQuestionCollection(qesId) {
    return question
    .findOne({questionId: qesId})
    .then(( oneQuestion, error, next) => {
      if(error){
        console.log(error);
        return next(error);
      }
      else{
        return oneQuestion;
      }
    })
  }
  
  module.exports = questionRoute;