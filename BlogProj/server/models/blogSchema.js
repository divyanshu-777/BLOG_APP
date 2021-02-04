const mongoose = require('mongoose');
const {
  ObjectId
} = mongoose.Schema.Types

const Schema = new mongoose.Schema({

      Title: {
          type: String,
          required: true
      },
      
      Description: {
          type: String,
          required: true
      },
      Text: {
          type: String,
          required: true
      },
      Writtenby: {
          type: ObjectId,
          ref: "User"
      },
      Comments: [{
          text: String,
          reply : [{
            repliedby :String,
            text :String,
          }],
          Postedby: {
            type: ObjectId,
            ref: "User"
          }
      }],
      Tags: [{
          type: ObjectId,
          ref: "User"
      }]
    }, {
      timestamps: true
    });

module.exports = mongoose.model('Blogs', Schema);