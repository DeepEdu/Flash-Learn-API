const express = require('express')
const path = require('path')
const mongoose = require('mongoose')
const cors = require('cors')
const bodyParser = require('body-parser')
const app = express()

const questionRoute = require('./route/route.question')

app.use(cors())
app.use(bodyParser.json())

app.use('/question/v1', questionRoute)

mongoose
  .connect('mongodb://127.0.0.1:27017/Question')
  .then((x) => {
    console.log(`Connected to Mongo! Database name: "${x.connections[0].name}"`)
  })
  .catch((err) => {
    console.error('Error connecting to mongo', err.reason)
  })

const port = process.env.PORT || 8081
app.listen(port, () => {
  console.log('Listening on port ' + port)
})
