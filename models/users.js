const mongoose = require("mongoose")

const Schema = mongoose.Schema

const UserSchema = new Schema({
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    forename: { type: String, required: false },
    surname: { type: String, required: false },
    password: { type: String, required: true },
    editor: { type: Boolean, required: false, default: false },
    administrator: { type: Boolean, required: true, default: false },
    locked: { type: Boolean, default: false } 
})

UserSchema.virtual("url").get(function () {
    // We don't use an arrow function as we'll need the this object
    return `/users/${this._id}`;
  });

module.exports = mongoose.model("User", UserSchema)


/**

{ email: "anon@geeman.org", username: "geeanon", password: "$2a$10$arx3BaH/3DIxKf66/Lee1OTpC/eZILdG6QtnbwrC0sur7/EYpJ/rO", editor: true }
 
 */