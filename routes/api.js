/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Board = require('../models/board.js');
const Thread = require('../models/thread.js');
const Reply = require('../models/reply.js');
//const BoardSchema = require('../models/BoardSchema.js');

mongoose
  .connect(process.env.MONGO_URI, { useUnifiedTopology: true, useNewUrlParser: true, useCreateIndex: true, useFindAndModify: false })
  .then(() => console.log('DB Connected!'))
  .catch(err => {
    console.log(Error, err.message);
  });

module.exports = function (app) {
  
  app.route('/api/threads/:board')
    .post(function(req, res, next) {
      console.log('/api/threads  post');

      Board.findOne({name: req.params.board})
        .populate('threads')
        .exec(function(err, boardData) {
        if (err) { console.log(err) };
        
        // hash thread password
        let hash = bcrypt.hashSync(req.body.delete_password, 10);
        let board = req.params.board;
        
        let newThread = new Thread({ // make new thread
            text: req.body.text,
            delete_password: hash,
            reported: false,
            created_on: Date.now(),
            bumped_on: Date.now(),
            replycount: 0
          })
        
        if (boardData === null) { // if no data make thread then make board
          newThread.save(function(err, threadData) {
            if (err) { console.log(err) };
            
            let newBoard = new Board({ 
              name: req.params.board,
              threads: threadData._id
            }).save(function(err, newBoardData) {
              if (err) { console.log(err) };
              res.redirect(`/b/${board}/`);
            })
          })
        } else { // if data make thread then add id to board
          // check if this thread is already in boardData
          let threadCheck = boardData.threads.some(v => v.text == req.body.text);
 
          if (threadCheck) { // if thread already in boardData do this
            res.send('There is already a thread under this name.')
          } else { // if thread not in boardData do this
            newThread.save(function(err, threadData) {
              boardData.threads.push(threadData._id); // add new thread id to boardData
              boardData.save() // save boardData
              res.redirect(`/b/${board}/`);
            })
          }
        }
      })
    })
  
    .put(function(req, res, next) {
      console.log('/api/threads  put');
      
      let threadId = !!req.body.report_id ? req.body.report_id : req.body.thread_id;

      Thread.findOneAndUpdate({_id: threadId}, {reported: true}, {new: true}, function(err, data) {
        if (err) {
          res.send('Wrong ID. Check ID and try again') ;
        } else {
          res.send('success');
        }
      })
    })
  
    .delete(function(req, res, next) {
      console.log('/api/threads  delete');
 
      Thread.findOne({_id: req.body.thread_id}, function(err, threadData) {

        if (err) { // if error with findOne, send error message 
          res.send('Failed to delete thread. Check inputs and try again.') 
        } else { // if no error with findOne do this
          let pwCheck = bcrypt.compareSync(req.body.delete_password, threadData.delete_password);
          if (pwCheck) { // if passwords match delete thread
            Thread.deleteOne({_id: req.body.thread_id}, function(err, deleteData) {
              if (err) { console.log(err) };
              res.send('success');
            })
          } else { // if passwords don't match send password error
            res.send('Failed to delete thread. Check delete password and try again.')
          }  
        }
      })
    })
  
    .get(function(req, res, next) {
      console.log('/api/threads  get');
    
      Board.findOne({name: req.params.board})
        .populate({path: 'threads', 
                   select: ['-delete_password', '-reported'],
                   options: {sort: '-created_on', limit: 10},
                   populate: {path: 'replies', select: ['-delete_password', '-reported'], options: {sort: '-created_on', limit: 3}}})
        .exec(function(err, data) {
          if (err) { console.log(err) };
          // sort the data in each set of replies
          data.threads.forEach(v => v.replies.sort((a, b) => {return new Date(a.created_on) - new Date(b.created_on)}))
          res.json(data.threads);
        })
    })
  
    
  app.route('/api/replies/:board')
    .post(function(req, res, next) {
      console.log('/api/replies  post');
      let board = req.params.board;
      let threadId = req.body.thread_id;
      
      Thread.findOne({_id: req.body.thread_id}, function(err, threadData) {
        if (err) { // if error wrong search data so repond with error
          res.send('Thread not found. Check inputs and try again') 
        } else { // if no error do this
          
          let hash = bcrypt.hashSync(req.body.delete_password, 10);
          let newReply = new Reply({
            text: req.body.text,
            reported: false,
            delete_password: hash,
            created_on: Date.now()
          }).save(function(err, replyData) {
            if (err) { console.log(err) };
            threadData.replies.push(replyData._id);
            threadData.replycount++; // add one to reply count
            threadData.save(function(err) {
              if (err) { console.log(err) };
              res.redirect(`/b/${board}/${threadId}/`);
            })
          }) 
        }
      })
    })
  
    .put(function(req, res, next) {
      console.log('/api/replies  put');
    
      Reply.findOneAndUpdate({_id: req.body.reply_id}, {reported: true}, {new: true}, function(err, data) {
        if (err) {
          res.send('Failed to report thread. Check reply ID and try again.');
        } else {
          res.send('success');
        }
      })
    })
  
    .delete(function(req, res, next) {
      console.log('/api/replies  delete');

      Reply.findOne({_id: req.body.reply_id}, function(err, findData) {
        if (err) { // if fail to findOne respond with error message
          res.send('Failed to delete reply. Check inputs and try again.')
        } else { // if reply found do this
          
          let pwCheck = bcrypt.compareSync(req.body.delete_password, findData.delete_password);
          if (pwCheck) {
            Reply.findOneAndUpdate({_id: req.body.reply_id}, {text: '[deleted]'}, {new: true}, function(err, deleteData) {
              if (err) { console.log(err) };
              res.send('success');
            })
          }  else {
            res.send('Failed to delete reply. Check password and try again.')
          }  
        }
      })
    })
  
    .get(function(req, res, next) {
      console.log('/api/replies  get');
    
      Thread.findOne({_id: req.query.thread_id})
        .populate({path: 'replies', select: ['-delete_password', '-reported']})
        .exec(function(err, data) {
          if (err) { console.log(err) };
          res.json(data);
        })
    })

};
