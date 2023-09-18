'use strict';
const { Thread, Reply } = require("../model/messageBoard")


module.exports = function (app) {

  app.route('/api/threads/:board')
    .post(async (req, res) => {
      // POST ROUTE
      const { board } = req.params
      const { text, delete_password } = req.body

      const thread = await Thread.create({
        board,
        text,
        delete_password,
        replies: [],
      })
      res.send(thread)
    })
    .get(async (req, res) => {
      // GET ROUTE
      const { board } = req.params
      let threads = await Thread.find({ board }).sort("-bumped_on").populate("replies")

      threads = threads.map(thread => {
        let threadToView = {
          _id: thread._id,
          text: thread.text,
          created_on: thread.created_on,
          bumped_on: thread.bumped_on,
          replies: thread.replies.sort((a, b) => a.created_on - b.created_on).slice(0, 3).map(reply => {
            let rep = {
              _id: reply._id,
              text: reply.text,
              created_on: reply.created_on,
            }
            return rep
          }),
        }
        return threadToView
      }).slice(0, 10)
      res.send(threads)
    })
    .delete(async (req, res) => {
      // DELETE ROUTE
      const { board, thread_id, delete_password } = req.body
      let threadToDelete = await Thread.findById(thread_id)
      if (threadToDelete && threadToDelete.delete_password === delete_password) {
        await threadToDelete.remove()
        res.send("success")
      } else {
        res.send("incorrect password")
      }
    })
    .put(async (req, res) => {
      // PUT ROUTE
      const { board, thread_id } = req.body
      let threadToUpdate = await Thread.findById(thread_id)
      if (threadToUpdate) {
        threadToUpdate.reported = true
        await threadToUpdate.save()
        res.send("reported")
      } else {
        res.send("incorrect thread id")
      }
    })

  app.route('/api/replies/:board')
    .post(async (req, res) => {
      // POST ROUTE
      const { board } = req.params
      const { text, delete_password, thread_id } = req.body
      let replyCreationTime = new Date()
      const reply = new Reply({
        text,
        delete_password,
        created_on: replyCreationTime,
      })

      let threadToUpdate = await Thread.findById(thread_id)
      threadToUpdate.replies.push(reply)
      threadToUpdate.bumped_on = replyCreationTime
      await threadToUpdate.save()
      res.send(threadToUpdate)
    })
    .get(async (req, res) => {
      // GET ROUTE
      const { thread_id } = req.query
      let thread = await Thread.findById(thread_id).populate("replies")

      let threadToView = {
        _id: thread._id,
        text: thread.text,
        created_on: thread.created_on,
        bumped_on: thread.bumped_on,
        replies: thread.replies.map(reply => {
          return {
            _id: reply._id,
            text: reply.text,
            created_on: reply.created_on,
          }
        }),
      }
      res.send(threadToView)
    })
    .delete(async (req, res) => {
      // DELETE ROUTE
      const { thread_id, reply_id, delete_password } = req.body

      let threadTarget = await Thread.findById(thread_id)
      for (let reply of threadTarget.replies) {
        if (reply._id.toString() === reply_id && reply.delete_password === delete_password) {
          reply.text = "[deleted]"
          threadTarget.bumped_on = new Date()
          await threadTarget.save()
          res.send("success")
          return
        }
      }

      res.send("incorrect password")
    })

    .put(async (req, res) => {
      const { thread_id, reply_id, board } = req.body
      const threadTarget = await Thread.findById(thread_id)
      const replyTarget = threadTarget.replies.find(reply => reply._id.toString() === reply_id)

      if (replyTarget) {
        replyTarget.reported = true
        threadTarget.bumped_on = new Date()
        await threadTarget.save()
        res.send("reported")
      } else {
        res.send("incorrect")
      }
    })

};
