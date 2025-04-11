const mongoose = require('mongoose');
const data = require('../data.js');

const categorySchema = new mongoose.Schema({
   title: {
        type: String,
        required : true
    },
     publishDate: {
        type: Date,
        required : true
    }, 
   

} ,{timestamps: true});

const CategoryModel = new mongoose.model("CategoryModel", categorySchema);

module.exports = CategoryModel;
