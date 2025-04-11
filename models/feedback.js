const mongoose = require('mongoose');
const data = require('../data.js');

const feedbackSchema = new mongoose.Schema({
   name: {
        type: String,
        required : true
    },
     email: {
        type: String,
        required : true
    }, 
    subject: {
        type: String,
        required : true
    }, 
    message: {
        type: String,
        required : true
    }, 
  

   

} ,{timestamps: true});

const FeedbackModel = new mongoose.model("FeedbackModel", feedbackSchema);

module.exports = FeedbackModel;
