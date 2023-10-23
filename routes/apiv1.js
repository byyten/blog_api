var express = require('express');
var router = express.Router();

const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs")
const { body, validator } = require("express-validator")
const Article = require("../models/articles")
const User = require("../models/users")
const Comment = require("../models/comments")
const salt_length = 10
const jwt_expiresIn = "86400s"
/*
    for node REPL cli
        Article = require("./models/articles")
        User = require("./models/users")
        Comment = require("./models/comments")

        users = await User.find({}, "email, administrator, editor")
*/

const jwt = require("jsonwebtoken");
const comments = require('../models/comments');

const jwtsecret = process.env.JWT_SECRET || "blowhard's_secret"

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

router.use(session({ 
  secret: process.env.PASSPORT_SECRET || "blowhard's session secret", 
  resave: false, 
  saveUninitialized: true 
}));


router.use(express.json());
router.use(express.urlencoded({ extended: true }));

router.use(passport.initialize());
router.use(passport.session());

router.use((req, res, next) => {
  res.locals.user = req.user ;
  next();
});

// deprecated
const isEmailOwner = (req, res, next) => {
    let [algorithm, payload, hash] = decomposeToken(req.token)
    if (!(payload.email == req.body.email || payload.administrator )) {
        res.json({ op: "post / unregister function", status: 403, result: "Not account owner or administrator"})
    }
    next()
}
// deprecated
const isAccountOwner = (req, res, next) => {
    let [algorithm, payload, hash] = decomposeToken(req.token)
    if (!(payload._id == req.params.id || payload.administrator )) {
        res.json({ op: "post / unregister function", status: 403, result: "Not account owner or administrator"})
    }
    next()
}

// email = "a.nony@geeman.org";  email="somebody@sfdomeemail.net"; input_password = "test_password" pwd = await bcrypt.hash("test_password", salt_length)
// pwd = await bcrypt.hash("anon", salt_length)  // salt_length default 10

// supports login 
async function check_password(email, password) {
    try {
        let user = await User.findOne({ email: email })
        if (user) {
            let match = await bcrypt.compare(password, user.password);
            let auth = { match: false, _id: user._id}
            if (match) {
              auth.match = true
            }
            return auth    
        } else {
            return { match: false, _id: false }
        }
    } catch (err) {
        console.log(err)
        return err
    }
}
// jwt token verification
const verifyToken = (req, res, next) => {
   // get the authorization header and extract token
   // format    Authorization: Bearer < jwt >
   try {
        const bearerheader = req.headers["authorization"]
        // all conditions must be stisfied for a valid header and then negate to reject invalid 
        if ( !(bearerheader.toLowerCase().indexOf("bearer") === 0 || 
            bearerheader === undefined  )) { // invlid header
            res.json({ op: "verify token", status: 403, result: "Token potentially invalid, Not authenticated"})
        }
        const bearerToken = bearerheader.split(" ")[1] 

        if (bearerToken !== "undefined") {
            req.token = bearerToken
            next()
        } else {
            res.json({ op: "verify token", status: 403, result: "Not authenticated"})
        } 
   } catch (err) {
    res.json({ op: "verify token", status: 403, result: "Not authenticated"})
   }
}

const varifyIfToken = (bearerToken) => {
    if (bearerToken) {
        idx1 = indexOf(".")
        idx2 = lastIndexOf(".")
        if (idx1 > 0 && idx1 === 36) { 
            // first 
        }
        hash_length = bearerToken.split(".")[2].length

    } else { return false }
}
// jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluaXN0cmF0b3JAYmxvZ19hcGkubmV0IiwiZWRpdG9yIjp0cnVlLCJhZG1pbmlzdHJhdG9yIjp0cnVlLCJpYXQiOjE2OTc3NTI0MjAsImV4cCI6MTY5Nzc1ODQyMH0.n36C3UoP-Hlg8FAZJl5ElGgl5x0Y9ZX1IvxMAglgdc4"
// decomposeToken (jwt)
const decomposeToken = (jwt) => {
    try {
        let [algorithm, payload, hash] = jwt.split(".")
        payload = JSON.parse(atob(payload))
        algorithm = JSON.parse(atob(algorithm))
        if ( !(hash.length === 43)) {
            throw new Error("potentially tampered token")
        }
        return [algorithm, payload, hash]    
    } catch (err) {
        console.log({ jwt, err })
    }
}

async function email_exists(email) { 
    return (await User.findOne({ email: email })) 
}
/* login instructions  */
// router.get('/login', function(req, res, next) {
//   res.json({ msg:'to login make a post to this route with username and password'});
// });

router.post("/register", async (req, res) => {
    try {
        let exists =  await User.findOne({ email: req.body.email }) // await email_exist(req.body.email) // User.findOne({ email: req.body.email })
        if (exists) { // an account with email already exists
            if (exists.locked) {
                res.json({ op: "post / register", status: 403, result: "unable to create account"})
            } else {
                res.json({ op: "post / register", status: 403, result: "unable to create - account exists"})
            }
        }
        req.body.password = await bcrypt.hash(req.body.password, salt_length)
        let new_user = new User(req.body)
        let new_user_result = await new_user.save()    
        delete new_user_result.password
        delete new_user_result.__v
        res.json({ op: "post / register success", status: 200, result: new_user_result})
    } catch (err) {
        res.json({ op: "post / register error", status: 500, result: err})
    }
})

// no verification
router.post("/unregister", verifyToken, isEmailOwner, async (req, res) => {
    jwt.verify(req.token, jwtsecret, (err, authentication_data) => {
        if (err) {
            res.json({ op: "post / unregister account", status: 403, result: err })
        }    
    })
    try {
        let unreg_user = await User.findOne({ email: req.body.email })
        console.log(unreg_user)
        if (!unreg_user) {
            res.json({ op: "post / unregister", status: 401, result: "bad password or username or both"})
        }
        match = await bcrypt.compare(req.body.password, unreg_user.password)
        if (match) {
            // can't remove account while articles or comments exist
            let articles_by_account = await Article.countDocuments({author: unreg_user._id})
            let comments_by_account = await Comment.countDocuments({author: unreg_user._id})
            
            if (articles_by_account === 0 && comments_by_account === 0) {
                let remove_result = await User.findOneAndRemove({ _id: unreg_user._id })
                res.json({ op: "post / unregister articles_by_account", status: 200, result: remove_result})
            } else {
                res.json({ op: "post / unregister articles_by_account", status: 402, result: { articles_by_account: articles_by_account }})
            }    
        } else {
            // should be 404 but if 404 leaking information to potential bad actor ? 
            res.json({ op: "post / unregister match", status: 500, result: match})
        }
    } catch (err) {
        res.json({ op: "post / unregister function", status: 401, result: "bad password or username or both", err: err})
    }
})

// router.post("/unregister/:id", verifyToken, isAccountOwner, async (req, res) => {
//     jwt.verify(req.token, jwtsecret, (err, authentication_data) => {
//         if (err) {
//             res.json({ op: "post / unregister by id verify", status: 403, result: err })
//         }    
//     })
//     try {
//         let articles_by_account = await Article.countDocuments({author: req.params.id})
//         if (articles_by_account == 0) {
//             let remove_result = await User.findOneAndRemove(req.params.id)
//             res.json({ op: "post / unregister articles_by_account", status: 200, result: remove_result})
//         } else {
//             res.json({ op: "post / unregister articles_by_account", status: 402, result: { articles_by_account: articles_by_account }})
//         }
//     } catch (err) {
//         res.json({ op: "post / unregister function", status: 500, result: err})
//     }
// })

router.post("/reset_password", verifyToken, async (req, res) => {
    jwt.verify(req.token, jwtsecret, async (err, authentication_data) => {
    // jwt.verify(req.token, jwtsecret, async (err, authentication_data) => {
        if (err) {
            res.json({ op: "reset password", status: 403, result: err })
        }  
        console.log( authentication_data )
        try {
            let account = await User.findOne({ email: req.body.email })
            let verify_old_password = await bcrypt.compare(req.body.old_password, account.password)
            if (verify_old_password) {
                req.body.new_password = await bcrypt.hash(req.body.new_password, salt_length)
                // req.body.new_password = await bcrypt.hash(req.body.new_password, salt_length)
                let find_result = await User.findOneAndUpdate({ email: req.body.email },{ $set: { password: req.body.new_password }})
                res.json({ op: "post / resetpassword find + update", status: 200, result: find_result, authentication_data: authentication_data})    
            } else {
                res.json({ op: "reset password", status: 401, result: "incorrect data"})
            }
        } catch (err) {
            res.json({ op: "post / resetpassword function", status: 500, result: err})
        }    
    })
})

// login
router.post('/login', async function(req, res, next) {
    try {
        let exists = await User.findOne({ email: req.body.email }) // email_exist(req.body.email) // 
        if (exists) { // an account with email already exists
            if (exists.locked) {
                res.json({ op: "post / login", status: 401, result: "not authenticated"})
            } 
        }
 
        // console.log([req.body.email, req.body.password])
        let auth = await check_password( req.body.email, req.body.password )
        let user = await User.findOne({ email: req.body.email })
        let token
        if (auth.match) {
            token = await jwt.sign({ 
                email: req.body.email, 
                editor: user.editor,
                administrator: user.administrator,
                _id:  user._id
            }, jwtsecret, { 
            expiresIn: jwt_expiresIn // , maxAge: "86400s" 
          })
          res.json({ op: "login", status: 200, token: token, email: req.body.email, _id: auth._id })
        } else {
          res.json({ op: "login", status: 404, result: "Not found" })
        }
    } catch (err) {
        res.json({ op: "login", status: 500, result: err })
    }
});

router.post("/users", verifyToken, isAccountOwner, async (req, res) => {
    jwt.verify(req.token, jwtsecret, async (err, authentication_data) => {
        if (err) {
            res.json({ op: "list users", status: 403, result: err })
        }  
        console.log( authentication_data )
        try {
            let [algorithm, payload, hash] = decomposeToken(req.token)
            if ( payload.administrator) {
                let users = await User.find({}, "_id email username editor administror")
                res.json({  op: "list users *(sensitive information)", status: 200, result : users })
            } else { 
                res.json({ op: "list users *(sensitive information) - not permitted", status: 403, result: "insuffient authority"})
            }
        } catch (err) {
            res.json({ op: "list users *(sensitive information)", status: 500, result: err})
        }    
    })
})


// article read - add verifyToken middleware if auth required on this route 
router.get("/articles", async (req, res) => {
    let articles
    if (req.query.id) {
        regex = /^[0-9,a-f]/
        if (req.query.id.length !== 24 && !regex.test(req.query.id.toLowerCase()) ) {
            res.json({ op: "get article by id", status: 403, result: "Invalid identifier, permissable = 24 bytes [a-f,0-9]"})
        }
    }
    if (req.query.id) {
        let article = await Article.findOne({_id: req.query.id, public: true})
        articles = [article]
    }
    if (req.query.title) {
        let article = await Article.findOne({title: req.query.title, public: true})
        articles = [article]
    } else if (!req.query.title && !req.query.id) {
        articles = await Article.find({ public: true})
    }
    res.json(articles)
})

router.post("/articles/administrator", verifyToken, async (req, res) => {
    jwt.verify(req.token, jwtsecret, async (err, authentication_data) => {
        if (err) {
            res.json({ op: "post / create article", status: 403, result: "Not authenticated" })
        }    
        console.log( authentication_data )
        let articles
        let [algorithm, payload, hash] = decomposeToken(req.token)
        if (payload.administrator) {
            if (req.query.id) {
                let article = await Article.findOne({_id: req.query.id})
                articles = [article]
            } else if (req.query.title) {
                let article = await Article.findOne({title: req.query.title})
                articles = [article]
            } else if (req.query.author_id) {
                let article = await Article.findOne({author: req.query.author_id })
                articles = [article]
            } else  { // if (!req.query.title && !req.query.id)
                articles = await Article.find({ })
            }
            res.json(articles)    
        } else {
            res.json({ op: "post articles administrative route", status: 403, result: "Not permitted - non administrator account"})
        }
    })
})

// article post / create protected route
router.post("/article", verifyToken, async (req, res) => {
    jwt.verify(req.token, jwtsecret, async (err, authentication_data) => {
        if (err) {
            res.json({ op: "post / create article", status: 403, result: "Not authenticated" })
        }    
        console.log( authentication_data )

        try {
            let [algorithm, payload, hash] = decomposeToken(req.token)
            let count = Article.countDocuments({ author: payload._id }) 
            if (count > maxArticles) {
                res.json( { op: "post article", status: 403, result: "Reached maximum postings in this current year"})
            }
            let article = new Article(req.body)
            if (payload._id === article.author.toHexString() || payload.administrator) {
                let article_save = await article.save();
                res.json({ op: "post / create article", status: 200, result: article_save })
            } else {
                res.json({ op: "post / create article", status: 401, result: "impersonator attempt to create article" })
            }
        } catch (err) {
            res.json({ op: "post / create article", status: 500, result: err })
        }
    })
})


// article + comments : get / read - add verifyToken middleware if auth required on this route 
router.get("/article/:id/comments", async (req, res) => {
    try {
        let [article, comments] = await Promise.all([
            Article.findOne({ _id: req.params.id, public: true }),
            Comment.find({ article: req.params.id, public: true })
        ])    
        if (article !== null && article.public) {
            res.json({ article, comments })
        } else {
            res.json({ op: "get article + comments", status: 404, result: "Not found" })
        }
    } catch (err) {
        res.json({ op: "get article and comments ", status: 500, result: err })
    }
})

router.get("/article/:id", async (req, res) => {
    try {
        let article = await Article.findOne({ _id: req.params.id, public: true })

        if (article !== null && article.public) {
            res.json(article)
        } else {
            res.json({ op: "get article + comments", status: 404, result: "Not found" })
        }
    } catch (err) {
        res.json({ op: "get article and comments ", status: 500, result: err })
    }
})

router.put("/article/:id/private", verifyToken, async (req, res) => {
    jwt.verify(req.token, jwtsecret, async (err, authentication_data) => {
        if (err) {
            res.json({ op: "update / put article private", status: 403, result: "Not authenticated" })
        }    
        console.log( authentication_data )

        try {
            let article = await Article.findOne({_id: req.params.id}) 
            let [algorithm, payload, hash] = decomposeToken(req.token)
            if (article !== null && ( payload._id == article.author.toHexString() || payload.administrator )) {
                article = await Article.findOneAndUpdate({_id: req.params.id}, {$set:{ public: false }})  
                res.json({ op: "put / update private", status: 200, result: article })  
            } else {
                res.json({ op: "put / update private", status: 404, result: "Not found" })
            }
        } catch (err) {
            res.json({ op: "put / update private", status: 500, result: err})
        }
    })
})

router.put("/article/:id/public", verifyToken, async (req, res) => {
    jwt.verify(req.token, jwtsecret, async (err, authentication_data) => {
        if (err) {
            res.json({ op: "update / put article public", status: 403, result: "Not authenticated" })
        }    
        console.log( authentication_data )

        try {
            let article = await Article.findOne({_id: req.params.id}) 
            let [algorithm, payload, hash] = decomposeToken(req.token)
            if (article !== null && ( payload._id == article.author.toHexString() || payload.administrator )) {
                article = await Article.findOneAndUpdate({_id: req.params.id}, {$set:{ public: true }})  
                res.json({ op: "put / update public", status: 200, result: article })  
            } else {
                res.json({ op: "put / update public", status: 404, result: "Not found" })
            }
        } catch (err) {
            res.json({ op: "put / update public", status: 500, result: err})
        }
    })
})


// // article put / update verifyToken, 
router.put("/article/:id", verifyToken, async (req, res) => {
    jwt.verify(req.token, jwtsecret, async (err, authentication_data) => {
        if (err) {
            res.json({ op: "update / put article ", status: 403, result: "Not authenticated" })
        }    
        console.log( authentication_data )

        try {
            let article = await Article.findOne({_id: req.params.id})  
            let [algorithm, payload, hash] = decomposeToken(req.token)
            if (article !== null && ( payload._id == article.author.toHexString() || payload.administrator )) {
                article = await Article.findOneAndUpdate({_id: req.params.id}, {
                    $set:{ 
                        title: req.body.title, 
                        content:req.body.content, 
                        public: req.body.public, 
                        date: req.body.date
                    }
                })  
                res.json({ op: "put / update", status: 200, result: article })  
            } else {
                res.json({ op: "put / update", status: 404, result: "Not found" })
            }
        } catch (err) {
            res.json({ op: "put / update", status: 500, result: err})
        }
    })
})

// article delete by id
router.delete("/article/:id", verifyToken, async (req, res) => {
    jwt.verify(req.token, jwtsecret, async (err, authentication_data) => {
        if (err) {
            res.json({ op: "delete article", status: 403, err: "Not authenticated"})
        }  
        console.log( authentication_data )  

        try {
            let [article, comments] = await Promise.all([
                Article.findOne({_id: req.params.id}) ,
                Comment.countDocuments({ article: req.params.id })
            ])
            // let result = await Article.findOne({_id: req.params.id})  
            let [algorithm, payload, hash] = decomposeToken(req.token)
            if (article === null  && !( payload._id == article.author.toHexString() || payload.administrator )) {
                res.json({ op: "delete article", status: 403, result: "Impersonation - Not owner or administrator" })
            }
            if (article !== null && comments == 0 && ( payload._id == article.author.toHexString() || payload.administrator )) {
                remove_result = await Article.findOneAndRemove({_id: req.params.id})
                res.json({ op: "put / delete article", status: 200, result: remove_result })  
            } else if (comments > 0 && ( payload._id == article.author.toHexString() || payload.administrator )) {
                // (shouldn't delete account prior to deleting comments and won't delete comments unless moderation considerations)
                res.json({ op: "delete article by id", status: 403, result: "Article has linked comments:" + comments})
            } else {
                
                if ( payload._id !== article.author.toHexString() && !payload.administrator ) {
                    res.json({ op: "delete article", status: 403, result: "Impersonation - Not owner or administrator" })
                } else {
                    res.json({ op: "delete article", status: 404, result: "Not found" })
                }
            }
        } catch (err) {
            res.json({ op: "delete article", status: 500, result: err})
        }
    })
})

// comments -------------------------------
// article read - add verifyToken middleware if auth required on this route 
router.get("/comments", async (req, res) => {
    if (req.query.id) {
        let comment = await Comment.findOne({_id: req.query.id, public: true}).populate("user").populate("article")
        let comm = JSON.parse(JSON.stringify({
            _id: comment._id,
            comment: comment.comment,
            date: comment.date,
            public: comment.public,
            author_username: comment.author.username,
            user_id: comment.author._id,
            article_id: comment.article._id,
            article_title: comment.article.title
        }))
        res.json([comm])
    } else  {
        let comments = await Comment.find({ public: true })
        res.json( comments )
    }
})

router.post("/comments/administrator", verifyToken, async (req, res) => {
    jwt.verify(req.token, jwtsecret, async (err, authentication_data) => {
        if (err) {
            res.json({ op: "post / get comments", status: 403, result: "Not authenticated" })
        }    
        console.log( authentication_data )
        let comments
        let [algorithm, payload, hash] = decomposeToken(req.token)
        if (payload.administrator) {
            if (req.query.id) {
                let comment = await Comment.findOne({_id: req.query.id})
                comments = [comment]
            } else if (req.query.author_id) {
                let comment = await Comment.findOne({user: req.query.author_id })
                comments = [comment]
            } else  { // if (!req.query.title && !req.query.id)
                comments = await Comment.find({ })
            }
            res.json(comments)    
        } else {
            res.json({ op: "post comments administrative route", status: 403, result: "Non administrator account"})
        }
    })
})

// get a comment by id alternative
router.get("/comment/:id", async (req, res) => {  // *? not sure
    // jwt.verify(req.token, jwtsecret, (err, authentication_data) => {
    //     if (err) {
    //         res.json({status: 403, err: "Not authenticated"})
    //     }    
    // })

    let comment = await Comment.findOne({_id: req.params.id, public: true}).populate("user").populate("article")
    let comm = JSON.parse(JSON.stringify({
        _id: comment._id,
        comment: comment.comment,
        date: comment.date,
        public: comment.public,
        author_username: comment.author.username,
        user_id: comment.author._id,
        article_id: comment.article._id,
        article_title: comment.article.title
    }))
    
    res.json([comm])
})

// article post / create protected route
router.post("/comment", verifyToken, async (req, res) => {
    jwt.verify(req.token, jwtsecret, async (err, authentication_data) => {
        if (err) {
            res.json({ op: "post comment", status: 403, result: "not authenticated" })
        }  
        console.log(authentication_data)  
   
        try {
            let [algorithm, payload, hash] = decomposeToken(req.token)
            let count = Comment.countDocuments({ author: payload._id }) 
            if (count > maxComments) {
                res.json( { op: "post comment", status: 403, result: "Reached maximum postings in this current year"})
            }
            let comment = new Comment(req.body)
            if (payload._id === comment.author.toHexString() || payload.administrator) {
                let comment_save = await comment.save();
                res.json({ op: "post / create comment", status: 200, result: comment_save })
            } else {
                res.json({ op: "post / create comment", status: 401, result: "impersonator attempt to create article" })
            }
        } catch (err) {
            res.json({ op: "post / create", status: 200, result: err })
        }
    })
    
})

// article put / update verifyToken, 
router.put("/comment/:id", verifyToken, async (req, res) => {
    jwt.verify(req.token, jwtsecret, async (err, authentication_data) => {
        if (err) {
            res.json({ op: "update / put comment", status:403, result: "Not authenticated"})
        }    
        console.log(authentication_data)
    
        try {
            let comment = await Comment.findOne({_id: req.params.id}) 
            let [algorithm, payload, hash] = decomposeToken(req.token)
            if (comment !== null && ( payload._id == comment.author.toHexString() || payload.administrator )) {
                comment = await Comment.findOneAndUpdate({ _id: req.params.id }, {
                    $set:{ 
                        comment: req.body.comment, 
                        public: req.body.public, 
                        date: req.body.date 
                    }
                })  
                res.json({ op: "put / update comment", status: 200, result: comment })   
            } else {
                if ( payload._id !== comment.author.toHexString() || payload.administrator ) {
                    res.json({ op: "put / update comment", status: 401, result: "Impersonation - Not owner of comment or Administrator" })
                } else {
                    res.json({ op: "put / update comment", status: 404, result: "Not found" })
                }
            }
        } catch (err) {
            res.json({ op: "put / update comment", status: 500, result: err})
        }
    })
})

// article delete *2
router.delete("/comment/:id", verifyToken, async (req, res) => {
    jwt.verify(req.token, jwtsecret, async (err, authentication_data) => {
        if (err) {
            res.json({ op: "delete comment", status: 403, result: "not authenticated" })
        }    
        console.log(authentication_data)

        try {
            let comment = await Comment.findOne({_id: req.params.id}) 
            let [algorithm, payload, hash] = decomposeToken(req.token)
            if (comment !== null && ( payload._id == comment.author.toHexString() || payload.administrator )) {
                comment = await Comment.findOneAndRemove({ _id: req.params.id })  
                res.json({ op: "delete comment", status: 200, result: comment })   
            } else {
                if ( payload._id == comment.author.toHexString() || payload.administrator ) {
                    res.json({ op: "delete comment", status: 401, result: "Impersonation - Not owner of comment or Administrator" })
                } else {
                    res.json({ op: "delete comment", status: 404, result: "Not found" })
                }
            }
        } catch (err) {
            res.json({ op: "delete comment", status: 500, result: err})
        }    
    })
})

router.put("/comment/:id/private", verifyToken, async (req, res) => {
    jwt.verify(req.token, jwtsecret, async (err, authentication_data) => {
        if (err) {
            res.json({ op: "update / put comment private", status: 403, result: "Not authenticated" })
        }    
        console.log( authentication_data )

        try {
            let comment = await Comment.findOne({_id: req.params.id}) 
            let [algorithm, payload, hash] = decomposeToken(req.token)
            if (comment !== null && ( payload._id == comment.author.toHexString() || payload.administrator )) {
                comment = await Comment.findOneAndUpdate({_id: req.params.id}, {$set:{ public: false }})  
                res.json({ op: "put / update comment private", status: 200, result: comment })  
            } else {
                res.json({ op: "put / update comment private", status: 404, result: "Not found" })
            }
        } catch (err) {
            res.json({ op: "put / update comment private", status: 500, result: err})
        }
    })
})

router.put("/comment/:id/public", verifyToken, async (req, res) => {
    jwt.verify(req.token, jwtsecret, async (err, authentication_data) => {
        if (err) {
            res.json({ op: "update / put comment public", status: 403, result: "Not authenticated" })
        }    
        console.log( authentication_data )

        try {
            let comment = await Comment.findOne({_id: req.params.id}) 
            let [algorithm, payload, hash] = decomposeToken(req.token)
            if (comment !== null && ( payload._id === comment.author.toHexString() || payload.administrator )) {
                comment = await Comment.findOneAndUpdate({_id: req.params.id}, {$set:{ public: true }})  
                res.json({ op: "put / update comment public", status: 200, result: comment })  
            } else {
                res.json({ op: "put / update comment public", status: 404, result: "Not found" })
            }
        } catch (err) {
            res.json({ op: "put / update comment public", status: 500, result: err})
        }
    })
})

module.exports = router;
