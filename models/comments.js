const mongoose = require("mongoose")

const Schema = mongoose.Schema

const CommentSchema = new Schema({
    comment: { type: String, required: true },
    date: { type: Date, required: true, default: Date.now() },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true }, // -> users.js
    article: { type: Schema.Types.ObjectId, ref: "Article", required: true }, // -> articles.js
    public: { type: Boolean, required: true, default: true } // if comment is public or not
})

CommentSchema.virtual("url").get(function () {
    // don't use an arrow function as  this object is required 
    return `/comments/${this._id}`;
  });

module.exports = mongoose.model("Comment", CommentSchema)


/* 
c = {
    comment: "demonstrably incorreect interpretation of reality and fact",
    date: new Date(Date.now() -3254325).toISOString(),
    user: "652f1a06388ccc73b41ee8f4",
    article: "652ef275322b59bed7cc6ca1",
    public: true
}

*/