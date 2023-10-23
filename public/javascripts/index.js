// // testing api/v1

/*
routes against database
    routes\apiv1.js | find "router"        
    
        router.get('/login', function(req, res, next) {
        router.post("/register", async (req, res) => {
        router.post("/unregister", verifyToken, isEmailOwner, async (req, res) => {
        router.post("/unregister/:id", verifyToken, isAccountOwner, async (req, res) => {
        router.post("/resetpassword/:id", verifyToken, isAccountOwner, async (req, res) => {
        router.post('/login', async function(req, res, next) {
        router.post("/users", verifyToken, isAccountOwner, async (req, res) => {
        router.get("/articles", async (req, res) => {
        router.post("/articles/administrator", verifyToken, async (req, res) => {
        router.post("/article", verifyToken, async (req, res) => {
        router.get("/article/:id/comments", async (req, res) => {
        router.get("/article/:id", async (req, res) => {
        router.put("/article/:id/private", verifyToken, async (req, res) => {
        router.put("/article/:id/public", verifyToken, async (req, res) => {
        router.put("/article/:id", verifyToken, async (req, res) => {
        router.delete("/article/:id", verifyToken, async (req, res) => {
        router.get("/comments", async (req, res) => {
        router.post("/comments/administrator", verifyToken, async (req, res) => {
        router.get("/comment/:id", async (req, res) => {  // *? not sure
        router.post("/comment", verifyToken, async (req, res) => {
        router.put("/comment/:id", verifyToken, async (req, res) => {
        router.delete("/comment/:id", verifyToken, async (req, res) => {
        router.put("/comment/:id/private", verifyToken, async (req, res) => {
        router.put("/comment/:id/public", verifyToken, async (req, res) => {

helper functions
    type public\javascripts\index.js | find "=>"         

    const auth_header = (token) => {
    const uuid = () => { 
    const isValid = (jwt) => {
    const decomposeToken = (jwt) => {
    const new_user = (email, password) => {
    const new_article = (author_id) => {
    const new_comment = (article_id, user_id) => {

test functions
        type public\javascripts\index.js | find "funct" 

    async function authenticate (user)  {    

    async function register(email, password) {
    async function unregister(email, password) {
    async function login(email, password) {

    async function get_user_list(jwt) {

    async function get_articles() {
    async function create_article(jwt_token, author_id) {
    async function update_article(jwt_token, article_id, updated_article) {
    async function delete_article(jwt_token, article_id) {
    async function mark_article(article_id, public, administrator_token) {

    async function get_article_comments(article_id) {
    async function get_comments() {
    async function create_comment(jwt_token, article_id, user_id) {
    async function update_comment(jwt_token, comment_id, updated_comment) {
    async function delete_comment(jwt_token, comment_id) {
    async function mark_comment(coment_id, public, administrator_token) {

*/



const tests = {
    administrator: {
        email: "administrator@blog_api.net",
        password: "anon"
    },
    editor: {
        email: "a.nony@geeman.org",
        password: "anon"
    },
    commenter: {
        email: "commenter@dssdfgdfg.org", // commenter@dssdfgdfg.org
        password: "test_password"
    },
    // register: {
    //     email: "somebody@someemailprovider.net",
    //     password: "trivialpassword",
    //     token: ""
    // },
    intruder: {
        email:  "commenter@dssdfgdfg.org",
        password: "guess_password",
    }
}

async function authenticate (user)  {    
    [tests[user].jwt_token, tests[user].auth_header, tests[user].login_result] = await login(tests[user].email, tests[user].password);
    tests[user]._id = tests[user].login_result._id;
    console.log(tests[user]);
    [tests[user].algorithm, tests[user].payload, tests[user].encryption] = decomposeToken(tests[user].jwt_token);
    console.log(tests[user].payload);
}

// helper functions
// return headers for fetch ops
const auth_header = (token) => {
    return { 'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization' : 'Bearer ' + token }
}

// in browser  -> "blob:http://localhost:3000/e7b2929f-669c-4208-ac57-0dbd674c2797" 
// in node     -> 'blob:nodedata:5468be38-6f95-4aa0-93c1-0f96cfd14206'
const uuid = () => { 
    let url = URL.createObjectURL(new Blob([]))
    if (url.indexOf("/") > -1) { // browser
        return url.split("/")[3]
    } else { // node
        return url.split(":")[2]
    }
 }

const isValid = (jwt) => {
    try {
        if (jwt === "" | !jwt) return ["","",""]
        let [algo, payload, hash] = jwt.split(".")
        return (JSON.parse(atob(payload)).exp * 1e3) > Date.now() 
    } catch (err) {
        return ({ valid: false, err })
    }
}

const decomposeToken = (jwt) => {
    try {
        if (jwt === "" | !jwt) return ["","",""]
        let [algorithm, payload, hash] = jwt.split(".")
        payload = JSON.parse(atob(payload))
        algorithm = JSON.parse(atob(algorithm))
        return [algorithm, payload, hash]
    } catch (err) {
        return ({ valid: false, err })
    }
}

const new_user = (email, password) => {
    return {
        "email": email,
        "username": "some_user_name",
        "forename": "some",
        "surname": "body",
        "password": password,
        "locked": false
      }
}

const new_article = (author_id) => {
    return { 
        title: "new by " + author_id + " @ " + Date.now(),
        content: "lorem ipsum amet casa fori emptor  ....",
        date: new Date().toISOString(),
        author: author_id,
        public: true,
        locked: false
    }
}

const new_comment = (article_id, user_id) => {
    return {
        comment: "commentry on the article " + article_id + " by " + user_id,
        date: new Date().toISOString(),
        public: true,
        author: user_id,
        article: article_id,
        locked: false
    }      
}

// account registration
async function register(email, password) {
    let user = new_user(email, password)
    
    let reg = await fetch("/api/v1/register", {
        method:"POST", 
        headers: {'Accept': 'application/json','Content-Type': 'application/json'}, 
        body: JSON.stringify(user)
    })
    result = await reg.json()    
    return result
}

// account removal
async function unregister(jwt_token, email, password) {
    let unregister = await fetch("/api/v1/unregister", {
        method:"POST", 
        headers: auth_header(jwt_token),
        body: JSON.stringify({email:email, password: password}) 
    })
    unregister_result = unregister.json()
    console.log(unregister_result)
    return unregister_result
} 

// account authentication
async function login(email, password) {  
    let logon = await fetch("/api/v1/login", {
        method:"POST", 
        headers: {'Accept': 'application/json','Content-Type': 'application/json'}, 
        body: JSON.stringify({email: email, password: password })
    })
    let result = await logon.json()
    if (result.status === 200) {
        console.log("success: auth JWT token" + result.token)
    }
    authheader = auth_header(result.token)
    return [result.token, authheader, result]
}

async function change_password(jwt_token, email, old_password, new_password) {
    let change = await fetch("/api/v1/reset_password", {
        method:"POST", 
        headers: auth_header(jwt_token), 
        body: JSON.stringify({email: email, old_password: old_password, new_password: new_password })
    })
    let result = await logon.json()
    if (result.status === 200) {
        console.log("success: auth JWT token" + result.token)
    }
    authheader = auth_header(result.token)
    return [result.token, authheader, result]
}

async function get_user_list(jwt) {
    userlist_res = await fetch("/api/v1/users", {
        method: 'post',
        headers: auth_header(jwt)
    })
    userlist = await userlist_res.json()
    return userlist
}

// login editor
// editor = await login("a.nony@geeman.org", "anon")

// get all articles without comments
async function get_articles(admin_jwt_token) { 
    if (admin_jwt_token && admin_jwt_token.split(".").length === 3) { // could be improved
        articles_res = await fetch("/api/v1/articles/administrator", {
            method: "post",
            headers: auth_header(admin_jwt_token)
        })    
    } else {
        articles_res = await fetch("/api/v1/articles")
    }
    articles = await articles_res.json()
    return articles
}

// account must be logged in
// e.g. res = await create_article(tests.editor.jwttoken, tests.editor._id)
async function create_article(jwt_token, author_id, admin=false) {
    try {
        let newarticle = new_article(author_id)
        let articles_res = await fetch("/api/v1/article" + (admin ? "/administrator" : ""), {
            method: "post", // "POST"
            headers: auth_header(jwt_token),
            body: JSON.stringify(newarticle)
        })
        create_article_res = await articles_res.json()
        return create_article_res
    } catch (err) {
        return ({err: err })
    }
}

async function update_article(jwt_token, article_id, updated_article) {
    try {
        let update_res = await fetch("/api/v1/article/" + article_id, {
            method: "put", 
            headers: auth_header(jwt_token),
            body: JSON.stringify(updated_article)
        })
        updated_article_res = await update_res.json()
        return updated_article_res
    } catch (err) {
        return ({ err })
    }
}

async function delete_article(jwt_token, article_id) {
    try {
        let options = {method: "delete", headers: auth_header(jwt_token)}
        let delete_res = await fetch("/api/v1/article/" + article_id, options)
        let delete_article_res = await delete_res.json()
        return delete_article_res
    } catch (err) {
        return { err }
    }
}

// mark article public 
async function mark_article(article_id, public, administrator_token) {
    try {
        let mark_res = await fetch("/api/v1/article/" + article_id + "/" + (public ? "public" : "private"), {
            method: "puT",
            headers: auth_header(administrator_token),
        })    
        let mark = await mark_res.json()
        return mark
    } catch (err) {
        return { err }
    }
 
}

async function mark_comment(comment_id, public, administrator_token) {
    try {
        let mark_res = await fetch("/api/v1/comment/" + comment_id + "/" + (public ? "public" : "private"), {
            method: "puT",
            headers: auth_header(administrator_token),
        })    
        let mark = await mark_res.json()
        return mark
    } catch (err) {
        return { err }
    }
 
}
  
// retrieve specific article and its comments 
async function get_article_comments(article_id) {
    try {
        let article_res = await fetch("/api/v1/article/" + article_id + "/comments")
        return (await article_res.json())   
    } catch (err) {
        return ({err: err })
    }
}

async function get_article(article_id) {
    try {
        let article_res = await fetch("/api/v1/article/" + article_id )
        return (await article_res.json())   
    } catch (err) {
        return ({err: err })
    }
}
// retieve all comments
// async function get_comments() {
//     try {
//         let get_res = await fetch("/api/v1/comments")
//         get_comment_res = await get_res.json()
//         return get_comment_res
//     } catch (err) {
//         return ({err: err })
//     }
// }

// get all articles without comments
async function get_comments(admin_jwt_token) { 
    if (admin_jwt_token) {
        comments_res = await fetch("/api/v1/comments/administrator", {
            method: "post",
            headers: auth_header(admin_jwt_token)
        })    
    } else {
        comments_res = await fetch("/api/v1/comments")
    }
    comments = await comments_res.json()
    return comments
}

async function create_comment(jwt_token, article_id, user_id) {
    try {
        let newcomment = new_comment(article_id, user_id)
        // let newcomment = new_comment(article_id, user_id)
        let comment_res = await fetch("/api/v1/comment", {
            method: "post", // "POST"
            headers: auth_header(jwt_token),
            body: JSON.stringify(newcomment)
        })
        create_comment_res = await comment_res.json()
        return create_comment_res
    } catch (err) {
        return ({err: err })
    }
}

// update / put - replaces entire comment so any field could be updated or none even 
async function update_comment(jwt_token, comment_id, updated_comment) {
    try {
        let update_res = await fetch("/api/v1/comment/" + comment_id, {
            method: "put", 
            headers: auth_header(jwt_token),
            body: JSON.stringify(updated_comment)
        })
        updated_comment_res = await update_res.json()
        return updated_comment_res
    } catch (err) {
        return ({err: err })
    }
}

async function delete_comment(jwt_token, comment_id) {
    try {
        let delete_res = await fetch("/api/v1/comment/" + comment_id, {
            method: "delete", 
            headers: auth_header(jwt_token)
        })
        delete_comment_res = await delete_res.json()
        return delete_comment_res
    } catch (err) {
        return ({err: err })
    }
}


