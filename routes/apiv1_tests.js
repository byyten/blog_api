// browser console testing 

await authenticate("administrator")
await authenticate("editor")
await authenticate("commenter")
await authenticate("intruder")

localStorage.setItem("tests", JSON.stringify(tests))
test = JSON.parse(localStorage.getItem("tests"))
isValid(test.administrator.jwt_token)

test.administrator.jwt_token.length
test.editor.jwt_token.length
test.commenter.jwt_token.length


reg_res = await register("liame1@email.com", "12345") // create email account
console.log(reg_res) // 200 OK

reg_res = await register("liame1@email.com", "12345") // attempt create second account same email
console.log(reg_res) // process ok, registration fails 403
// {
//     "op": "post / register",
//     "status": 403,
//     "result": "unable to create - account exists"
//   }

[token, header, result] = await login("liame1@email.com", "12345") // correct 200
console.log(token) // jwt token
console.log(header) // headers
console.log(result) 
// {
//     "op": "login",
//     "status": 200,
//     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImxpYW1lMUBlbWFpbC5jb20iLCJlZGl0b3IiOmZhbHNlLCJhZG1pbmlzdHJhdG9yIjpmYWxzZSwiX2lkIjoiNjUzNmRhZWU4YzZlN2ExZTE0ZDNjMjc4IiwiaWF0IjoxNjk4MDk2Nzc2LCJleHAiOjE2OTgxODMxNzZ9.tPVyHcyhAPhszhfCxC0XK4mxWWd4CaIukCeOIbgFUiY",
//     "email": "liame1@email.com",
//     "_id": "6536daee8c6e7a1e14d3c278"
//   }

unreg_res = await unregister(token, "liame1@email.com", "12345")
console.log(unreg_res) // correct email same
console.log(unreg_res.result.email)

chpwd = await change_password(token,  "liame1@email.com", "12345", "54321")
console.log(chpwd)

[token, header, result] = await login("liame1@email.com", "12345") // process succeeds, authentication fails token undefined
console.log([token, header, result]) // process succeeds, authentication fails token undefined
console.log(result)  // 404 not found 

[token, header, result] = await login("liame1@email.com", "54321") // process succeeds, authentication correct token evident
console.log([token, header, result]) // process succeeds, authentication ok token evident
console.log(result)  // 200

articles = await get_articles()
article_resp = await create_article(test.editor.jwt_token, test.editor._id)
console.log(article_resp)

articles = await get_articles()
editor_article = articles.slice(articles.length - 1, articles.length)[0]
article_resp = await create_article(test.administrator.jwt_token, test.editor._id)
console.log(article_resp)

articles = await get_articles()
article_resp = await create_article(test.commenter.jwt_token, test.editor._id)
console.log(article_resp)

articles = await get_articles()
article_resp = await create_article(test.commenter.jwt_token, test.commenter._id)
console.log(article_resp)

articles = await get_articles()
commenter_article = articles.slice(articles.length - 1, articles.length)[0]
article_resp = await create_article(test.intruder.jwt_token, test.intruder._id)

articles = await get_articles()
article_resp = await create_article(test.intruder.jwt_token, test.intruder._id)
console.log(article_resp)

articles = await get_articles()
clone = Object.assign({}, commenter_article)
clone.title = "modded by administrator " + clone.title
up_res = await update_article(test.administrator.jwt_token, clone._id, clone )
console.log(up_res)
articles = await get_articles()
articles.find(a => a._id === clone._id)  // correct

clone = Object.assign({}, editor_article)
clone.title = "modded by editor " + clone.title
up_res = await update_article(test.editor.jwt_token, clone._id, clone )
console.log(up_res)
articles = await get_articles()
articles.find(a => a._id === clone._id)  // correct


editor_article = articles.find(a => a._id === clone._id) // update to latest version of editor article
clone = Object.assign({}, editor_article) // re-clone
clone.title = "latest attempt modded by commenter " + clone.title // alter
up_res = await update_article(test.commenter.jwt_token, clone._id, clone ) // attempt impersonator update
console.log(up_res) // expect no change to article
articles = await get_articles()
articles.find(a => a._id === clone._id)  // correct  title: modded by editor...


del_res = await delete_article(test.commenter.jwt_token, clone._id ) // correct impersonation commenter not owner
articles = await get_articles()  // expect unchanged article count

del_res = await delete_article(test.editor.jwt_token, clone._id ) // delete article by owner
console.log(del_res) // correct 
articles = await get_articles()  // expect one less article


article_resp = await create_article(test.editor.jwt_token, test.editor._id) // create article to delete
console.log(article_resp)
articles = await get_articles() // expect one more article

del_res = await delete_article(test.administrator.jwt_token, articles.at(-1)._id ) // correct
console.log(del_res)
articles = await get_articles()  // expect one less article


// ----------
arts_0_id = "65302f881f79cd0a2581f505"  // articles[0] has comments // gotcha could be PRIVATE so you don't see it
articles.find(a=> a._id === arts_0_id)

articles[0]._id === arts_0_id
get_res = await get_article_comments(arts_0_id) // correct
get_res = await get_articles(test.administrator.jwt_token) // correct
get_res = await get_article_comments(arts_0_id) // correct

arts_2_id = "6530c2bd09c73b1d2f4de16e"
get_res = await get_article_comments(arts_2_id) // correct
articles = await get_articles()
mark_res = await mark_article(arts_0_id, false, test.administrator.jwt_token) // correct

articles = await get_articles() // expect one less (public) article
mark_res = await mark_article(arts_0_id, false, test.administrator.jwt_token) // correct

mark_res = await mark_article(arts_0_id, false, test.administrator.jwt_token) // correct
get_res = await get_article_comments(arts_0_id) // correct

arts_0_id = "65302f881f79cd0a2581f505"  // articles[0] has comments
mark_res = await mark_article(arts_0_id, false, test.administrator.jwt_token) // correct
test.administrator.jwt_token
arts_0_id
mark_res = await mark_article(arts_0_id, false, test.administrator.jwt_token) // correct

mark_res = await mark_article(arts_0_id, true, test.administrator.jwt_token) // correct
get_res = await get_article_comments(arts_0_id) // correct
get_res = await get_article_comments(arts_0_id) // correct
get_res = await get_article_comments(arts_0_id) // correct


// -------------------------------------------------
get_res = await get_articles(arts_0_id) // crashes node because if first parameter expects jwt not an identifier 
// 		therefore fails verification "65302f881f79cd0a2581f505".length
//    console output
//       GET /api/v1/article/65302f881f79cd0a2581f505/comments 200 220.920 ms - 65
//       undefined
//       {
//         jwt: '65302f881f79cd0a2581f505',
//         err: DOMException [InvalidCharacterError]: The string to be decoded is not correctly encoded.


console.log(get_res) // Object { err: TypeError }

// recommend creating validation for jwt on verifyToken

mark_res = await mark_article(arts_0_id, false, test.administrator.jwt_token) // correct
get_res = await get_article(arts_0_id) // correct 404 not found
console.log(get_res)

	// repeats 
      {
              mark_res = await mark_article(arts_0_id, false, test.administrator.jwt_token) // correct
              get_res = await get_article_comments(arts_0_id) // correct 404 not found
              console.log(get_res)
              get_res = await get_article(arts_0_id) // correct 404 not found
              console.log(get_res)
              // mark an article public (is visible)
              mark_res = await mark_article(arts_0_id, false, test.administrator.jwt_token) // correct
              console.log(mark_res)
              get_res = await get_article_comments(arts_0_id) // correct 404 not found
              console.log(get_res)
              get_res = await get_article(arts_0_id) // correct 404 not found
              console.log(get_res)
              mark_res = await mark_article(arts_0_id, true, test.administrator.jwt_token) // correct
              console.log(mark_res)
              get_res = await get_article_comments(arts_0_id) // correct 404 not found
              console.log(get_res)
              get_res = await get_article(arts_0_id) // correct 404 not found
              console.log(get_res)

              get_res = await get_article(arts_0_id) // corre
              get_res = await get_article(arts_0_id) // correct 404 not found
              console.log(get_res)
              get_res = await get_article_comments(arts_0_id) // correct 404 not found
              console.log(get_res)
              get_res = await get_article_comments(arts_0_id) // correct 404 not found
              console.log(get_res)
              get_res = await get_article(arts_0_id) // correc
              get_res = await get_article(arts_0_id) // correct 404 not found
              console.log(get_res)
              mark_res = await mark_article(arts_0_id, false, test.administrator.jwt_token) // correct
              console.log(mark_res)get_res = await get_article_comments(arts_0_id) // correct 404 not found
              console.log(get_res)
              get_res = await get_article(arts_0_id) // correct 404 not found
              console.log(get_res)

              get_res = await get_article(arts_0_id) // correct 404 not found
              console.log(get_res)

              mark_res = await mark_article(arts_0_id, true, test.administrator.jwt_token) // correct
              console.log(mark_res)
              get_res = await get_article_comments(arts_0_id) // correct 404 not found
              console.log(get_res)
              get_res = await get_article(arts_0_id) // correct 404 not found
              console.log(get_res)
      }

comms = await get_comments()
create_comm_res = await create_comment(test.commenter.jwt_token, arts_0_id, test.commenter._id) // correct
console.log(create_comm_res)
comms = await get_comments() 


clone = comms.slice(comms.length-1, comms.length)[0]
clone_id = clone._id
clone.comment = "altered owner (commenter) " + clone.comment 
upd_comm_res = await update_comment(test.commenter.jwt_token, clone._id, clone)
console.log(upd_comm_res)
comms = await get_comments()
comms.find(c => c._id == clone._id)


clone = comms.slice(comms.length-1, comms.length)[0]
clone.comment = "attempt altered editor " + clone.comment 
update_comm_res = await update_comment(test.editor.jwt_token, clone._id, clone) // correct
console.log(update_comm_res) // impersonation
comms = await get_comments() // expect unaltered count
comms.find(c => c._id == clone._id) // expect unaltered comment

clone = comms.slice(comms.length-1, comms.length)[0]
clone.comment = "altered admin " + clone.comment 
update_comm_res = await update_comment(test.administrator.jwt_token, clone._id, clone) // correct
console.log(update_comm_res) // impersonation
comms = await get_comments() // expect unaltered count
comms.find(c => c._id == clone._id) // expect altered comment -> altered admin altered owner (commenter)....



del_res = await delete_comment(test.editor.jwt_token, clone._id) // expect 404 not found but really is impersonation
comms = await get_comments() // expect unaltered count
comms.find(c => c._id == clone._id) // expect to exist

del_res = await delete_comment(test.commenter.jwt_token, clone._id) // expect 200 correct
comms = await get_comments() // expect one less comment
comms.find(c => c._id == clone._id) // expect to NOT exist -> undefined


// createa comment to delete by administrator
    create_comm_res = await create_comment(test.commenter.jwt_token, arts_0_id, test.commenter._id) // correct
    console.log(create_comm_res)
    comms = await get_comments() // expect one more comment

del_res = await delete_comment(test.administrator.jwt_token, comms.at(-1)._id)
console.log(del_res) // expect 200
comms = await get_comments() // expect one less comment


// createa comment to mark public / private by owner(commenter), editor(impersonator), administrator
    create_comm_res = await create_comment(test.commenter.jwt_token, arts_0_id, test.commenter._id) // correct
    console.log(create_comm_res)
    comms = await get_comments() // expect one more comment
		comms_id = comms.at(-1)._id


comms_id = comms.at(-1)._id
mark_res = await mark_comment(comms_id, false, test.commenter.jwt_token) // 200
comms = await get_comments() // expect one less public comment (public -> private )

mark_res = await mark_comment(comms_id, true, test.commenter.jwt_token)
comms = await get_comments() // expect one more public comment (private -> public) 

mark_res = await mark_comment(comms_id, false, test.editor.jwt_token) // impersonation
comms = await get_comments() // expect unchanged public comments 


// ---- wierdness starts
mark_res = await mark_comment(comms_id, false, test.administrator.jwt_token) // 200  administrator  (public -> private )
comms = await get_comments() // expect one less public comment ( public -> private)
comms.find(c => c._id === comms_id) // expect undefined 
comms = await get_comments() // expect one less public comment (public -> private )

mark_res = await mark_comment(comms_id, true, test.administrator.jwt_token) // 200  administrator  (private -> public )
comms = await get_comments()  //expect one more public comment (private -> public)
comms.find(c => c._id === comms_id) // expect comment body
comms = await get_comments() // expect one more public comment (private -> public )

comms = await get_comments(test.administrator.jwt_token) // expect all comments (public and private)






// // simple validating a token w/o using decode
// [jwt = test.administrator.jwt_token, jwt.indexOf("."), jwt.lastIndexOf("."), jwt.split(".")[2].length]
// [jwt = test.editor.jwt_token, jwt.indexOf("."), jwt.lastIndexOf("."), jwt.split(".")[2].length]
// [jwt = test.commenter.jwt_token, jwt.indexOf("."), jwt.lastIndexOf("."), jwt.split(".")[2].length]

// let [algorithm, payload, hash] = jwt.split(".")
//         payload = JSON.parse(atob(payload))
//         algorithm = JSON.parse(atob(algorithm))









