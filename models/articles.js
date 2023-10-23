const mongoose = require("mongoose")

const Schema = mongoose.Schema

const ArticleSchema = new Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    date: { type: Date, required: true, default: Date.now() },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true }, // -> users.js
    public: { type: Boolean, required: true, default: false }
})

ArticleSchema.virtual("url").get(function () {
    // don't use an arrow function as  this object is required 
    return `/articles/${this._id}`;
  });

module.exports = mongoose.model("Article", ArticleSchema)


/** 
article = { title: "article title",
  content: "lorem ipsum amet ....",
  date: Date.now(),
  author_id: "652e25b0c2767b7501099051",
  public: false
}
  
articles = await Article.find().exec()

[articles, authors] = await Promise.all([
  Article.find().exec(),
  User.find({}, "username email").exec()
])



altered_article = { title: "altered article title",
  content: "lorem ipsum amet casa fori emptor  ....",
  date: Date.now(),
  author_id: "652e25b0c2767b7501099051",
  public: false
}


 * 
*/