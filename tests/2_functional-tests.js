const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');
const { Thread, getThreadId, getReplyId } = require("../model/messageBoard")


chai.use(chaiHttp);

const threadPostData = { board: "test", text: "test", delete_password: "test" }
let replyData = { text: "test", delete_password: "test", board: "test" }

suite('Functional Tests', function () {

  test("#1 POST: Creating a new thread", function (done) {
    chai.request(server)
      .post("/api/threads/test")
      .send(threadPostData)
      .end(async (err, res) => {
        assert.equal(res.status, 200)
        assert.isDefined(res.body._id)
        assert.isArray(res.body.replies)
      })
    done()
  })

  test("#2 GET: Viewing the 10 most recent threads with 3 replies each", function (done) {
    chai.request(server)
      .get("/api/threads/test")
      .end(function (err, res) {
        assert.equal(res.status, 200)
        assert.isArray(res.body)
        assert.isObject(res.body[0])
        assert.isDefined(res.body[0].text)
        assert.isDefined(res.body[0].created_on)
        assert.isDefined(res.body[0].bumped_on)
        assert.isArray(res.body[0].replies)
        assert.isBelow(res.body[0].replies.length, 4)
        done()
      })
  })

  test("#3 DELETE: Deleting a thread with the incorrect password", async function () {
    thread = await getThreadId("test", "test")
    chai.request(server)
      .delete("/api/threads/test")
      .send({
        ...threadPostData,
        thread_id: thread._id.toString(),
        delete_password: "incorrect"
      })
      .end(function (err, res) {
        assert.equal(res.status, 200)
        assert.equal(res.text, "incorrect password")
      })
  })

  test("#5 PUT: Reporting a thread", async function () {
    thread = await getThreadId("test", "test")
    chai.request(server)
      .put("/api/threads/test")
      .send({
        ...threadPostData,
        thread_id: thread._id.toString(),
      })
      .end(function (err, res) {
        assert.equal(res.status, 200)
        assert.equal(res.text, "reported")
      })
  })

  // // ------------------------------------------------------------- //

  test("#6 POST: Creating a new reply", async function () {
    thread = await getThreadId("test", "test")
    chai.request(server)
      .post("/api/replies/test")
      .send({
        ...replyData,
        thread_id: thread._id.toString(),
      })
      .end(function (err, res) {
        assert.equal(res.status, 200)
        assert.isDefined(res.body._id)
        assert.isArray(res.body.replies)
        assert.isObject(res.body.replies[0])
        assert.isDefined(res.body.replies[0].text)
        assert.isDefined(res.body.replies[0].created_on)
      })
  })

  test("#7 GET: Viewing a single thread with all replies", async function () {
    thread = await getThreadId("test", "test")
    chai.request(server)
      .get("/api/replies/test" + "?thread_id=" + thread._id.toString())
      .end(function (err, res) {
        assert.equal(res.status, 200)
        assert.isObject(res.body)
        assert.isDefined(res.body.text)
        assert.isDefined(res.body.created_on)
        assert.isDefined(res.body.bumped_on)
        assert.isArray(res.body.replies)
        assert.isObject(res.body.replies[0])
        assert.isDefined(res.body.replies[0].text)
        assert.isDefined(res.body.replies[0].created_on)
      })
  })

  test("#8 DELETE: Deleting a reply with the incorrect password", async function () {
    thread = await getThreadId("test", "test")
    let threadId = thread._id.toString()
    reply = await getReplyId(threadId)
    chai.request(server)
      .delete("/api/replies/test")
      .send({
        thread_id: threadId,
        reply_id: reply._id.toString(),
        delete_password: "incorrect",
      })
      .end(function (err, res) {
        assert.equal(res.status, 200)
        assert.equal(res.text, "incorrect password")
      })
  })

  test("#9 DELETE: Deleting a reply with the correct password", async function () {
    thread = await getThreadId("test", "test")
    let threadId = thread._id.toString()
    reply = await getReplyId(threadId)
    chai.request(server)
      .delete("/api/replies/test")
      .send({
        thread_id: threadId,
        reply_id: reply._id.toString(),
        delete_password: reply.delete_password || "test",
      })
      .end(function (err, res) {
        assert.equal(res.status, 200)
        assert.equal(res.text, "success")
      })
  })

  test("#10 PUT: Reporting a reply", async function () {
    thread = await getThreadId("test", "test")
    let threadId = thread._id.toString()
    reply = await getReplyId(threadId)
    chai.request(server)
      .put("/api/replies/test")
      .send({
        thread_id: threadId,
        reply_id: reply._id.toString(),
        board: "test"
      })
      .end(function (err, res) {
        assert.equal(res.text, "reported")
        assert.equal(res.status, 200)
      })
  })


  test("#4 DELETE: Deleting a thread with the correct password", async function () {
    thread = await getThreadId("test", "test")
    chai.request(server)
      .delete("/api/threads/test")
      .send({
        ...threadPostData,
        thread_id: thread._id.toString(),
      })
      .end(function (err, res) {
        assert.equal(res.status, 200)
        assert.equal(res.text, "success")
      })
  })

});
