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
        questionId: qId,
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

  // Get Quiz Question 
  questionRoute.route("/question/quiz").get(async (req, res, next) => {
    var usrId = req.body.userId;
    // quizQuestionCount is total question to be taken in Quiz
    var quizQuestionCount = req.body.count;
    const quizList = [];
      // Function to find total number of Question of the user
      const lenQuestion = await findCountOfQuestions(usrId);
      distribution
      .find({userId: usrId},(error,data) => {
        if(error){
          console.log("UserId not found:"+error);
          return next(error);
        }
        else{
        console.log("Range of the user are " + data);
        if(data.length == 0) {
          console.log(" ERROR: Data Not found" + data.length);
          return next(error);
        }
        for(let i =0; i<data.length; i++){

          // Equity is total Question from each Range to be in Quiz
          let equity = (data[i].countQuestion*quizQuestionCount)/lenQuestion;
          console.log("Total Question in each Range:: " + equity);
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
              let qesId = quizQuestion[i].questionId;
              // To find all Question with the given question Id
              var theQuestion = await findQuestionDetail(qesId);
              console.log("theQuestion:: "+theQuestion);
              // pushing Question to QuizList
              quizList.push( schemaForQuiz(theQuestion) );
                /** 
                 * if total Question length for Quiz is equal to 
                 * the length of the question present in all range for the user 
                */
                if(quizList.length == quizQuestionCount){
                  console.log("QuizList Length is: "+ quizList.length);
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
        questionId:theQuestion.quesId,
        ques: theQuestion.ques,
        ans: theQuestion.ans
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
      return totques[0].total;
    })
    }
  
  // function to find the Question from Qid in the Question Collection
  async function findQuestionDetail(qesId) {
    return question
    .findOne({questionId: qesId})
    .then(( oneQuestion, error, next) => {
      if(error){
        console.log("Failed to find question Id: " +error);
        return next(error);
      }
      else{
        // console.log("oneQuestion"+oneQuestion);
        return oneQuestion;
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
      console.log("Error deleting in Question Collection: "+error);
      return next(error);
    }else{
      console.log("Question with QuesId { " + qId + " }deleted Successfully from Question Collection  ");
    }
  })
}

// function to decrement total number of question from Distribution Collection
function updateDistribution(qId, usrId){
  quiz.findOne( {UserId: usrId, questionId : qId} ,(error, data, next) => {
    if (error) {
      console.log("Error: Failed to find question Id" + error);
      return next(error);
    }
    else {
      let explvl = data.expertiseLevel;
      distribution.findOneAndUpdate(
        { 
          "userId": data.userId, 
          "RangeMin" : {$lt: explvl}, 
          "RangeMax" : {$gte : explvl} 
        }, 
        { 
            $inc : {'countQuestion' : -1} 
        }, 
        (error, countQue) => {
        if (error){
          console.log("Failed to update Question" + error);
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
  quiz.deleteOne({userId: usrId, questionId : qId}, (error) => {
    if (error) {
      console.log("Error deleting in quiz Collection" +error);
      return next(error);
    }else{
      console.log("Question deleted Successfully from Quiz Collection");
    }
  })
}

  module.exports = questionRoute;
