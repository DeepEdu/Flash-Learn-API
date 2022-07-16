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
    const lenQuestion = await findCountOfQuestions(usrId);
    console.log("lenQuestion" +lenQuestion);
      distribution
      .find({userId: usrId},(error,data) => {
        if(error){
          console.log(error);
          return next(error);
        }
        else{
        // Function to find total number of Question of the user
        console.log("Range of the user are " + data);
        if(data.length == 0) {
          console.log(" ERROR: Data Not found" + data.length);
          return next(error);
        }
        for(let i =0; i<data.length; i++){

          // Equity is total Question from each Range to be in Quiz
          let equity = (data[i].countQuestion*quizQuestionCount)/lenQuestion;
          console.log("equity" +equity)
          const temp = data[i];
          // Rounding Off equity to get the Question
          equity = Math.round(equity);

          // Find equity number of QuestionIds from quiz collection, 
          // whose expertiseLevel is in the current range.
          quiz
          .find({'userId': usrId, 'expertiseLevel' :{ $gt : temp.RangeMin, $lte: temp.RangeMax} })
          .limit(equity)
          .then(async(quizQuestion) => {
            for (let i = 0; i < quizQuestion.length; i++) {
              let qesId = quizQuestion[i].quesId;
              // To find all Question with the given question Id
              var theQuestion = await findQuestionDetail(qesId);
              // pushing Question to QuizList
              
              quizList.push( schemaForQuiz(theQuestion) );
                console.log("List of Question in Quiz:"+quizList);
                /** 
                 * if total Question length for Quiz is equal to 
                 * the length of the question present in all range for the user 
                */
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


  function schemaForQuiz(theQuestion){
    return (
      {
        QuestionId:theQuestion.questionId,
        Question: theQuestion.ques,
        Answer: theQuestion.ans
      }); 
  }
  // function to find Total number of Question in
  async function findCountOfQuestions(usrId){
     return distribution.aggregate([
      {
        $match: {
          userId: usrId
        }
      }, {
        $group: {
          _id: "$userId",
          total: {
            $sum: "$countQuestion"
          }
        }
      }
    ])
    .then((totques) =>{
      console.log("total" + totques[0].total);
      return totques[0].total;
    })
    }
  
  // function to find the Question from Qid in the Question Collection
  async function findQuestionDetail(qesId) {
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