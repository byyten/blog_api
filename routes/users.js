var express = require('express');
var router = express.Router();

// const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs")
// user_pwd = await bcrypt.hash("top secret password", 10)
const { body, validator } = require("express-validator")
const Article = require("../models/articles")
const User = require("../models/users")

const jwt = require("jsonwebtoken")

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await User.findOne({ username: username });
      if (!user) {
        return done(null, false, { message: "Incorrect username or password" });
      };

      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        // passwords do not match!
        return done(null, false, { message: "Incorrect password or username" })
      }
      // if (user.password !== password) {
      //   return done(null, false, { message: "Incorrect password" });
      // };
      return done(null, user);
    } catch(err) {
      return done(err);
    };
  })
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch(err) {
    done(err);
  };
});

// router.use(session({ 
//   secret: process.env.PASSPORT_SECRET || "blowhard's session secret", 
//   resave: false, 
//   saveUninitialized: true 
// }));


router.use(express.json());
router.use(express.urlencoded({ extended: true }));

router.use(passport.initialize());
router.use(passport.session());

router.use((req, res, next) => {
  res.locals.user = req.user ;
  next();
});


async function check_password(email, input_password) {
  let hashed_password = await User.findOne({email: email}).exec()
  let match = await bcrypt.compare(input_password, hashed_password.password);
  let auth = { match: false, perms: false}
  if (match) {
    auth.match = auth.perms = true
  }
  return auth
}


const verifyToken = (req, res, next) => {
   
}

/* GET users listing. */
// router.get('/', function(req, res, next) {
//   res.send('respond with a resource');
// });


// form based
// router.post('/api/v1/login', passport.authenticate("local", {
//   successRedirect: "/messageboard",
//   failureRedirect: "/signin"
// })
// )

router.post('/api/v1/login', async function(req, res, next) {
  console.log([req.body.email, req.body.password])
  let auth = await check_password(req.body.email, req.body.password)
  if (auth.match) {
    let token = await jwt.sign({ 
      email: req.body.email, 
      editor: auth.perms 
    }, process.env.JWT_SECRET || "blowhard's jwt secret", { 
      expiresIn: "60s", maxAge: "86400s" 
    })
    res.json({ status: 200, token: token })
  } else {
    res.json({ status: 403 })
  }
});

module.exports = router;
