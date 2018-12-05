const mongo = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectID;
const url = process.env.DB;

function ReplyHandler() {
  this.replyList = (req, res) => {
      let board = req.params.board;
      mongo.connect(url, (err, db) => {
        db.collection('messageBoard')
          .find({_id: new ObjectId(req.query.thread_id)},
            {
            reported: 0,
            delete_password: 0,
            "replies.delete_password": 0,
            "replies.reported": 0
            })
          .toArray(function(err,doc){
            res.json(doc[0]);
        });
      });
    }
    
    this.newReply = (req, res) => {
      let board = req.params.board;
      const reply = {
        _id: new ObjectId(),
        text: req.body.text,
        created_on: new Date(),
        reported: false,
        delete_password: req.body.delete_password,
      };
      
      mongo.connect(url, (err, db) => {
        db.collection('messageBoard')
          .findAndModify(
            {_id: new ObjectId(req.body.thread_id)},
            [],
            {
              $set: {bumped_on: new Date()},
              $push: { replies: reply  }
            },(err, doc) => {});
      });
      res.redirect('/b/'+board+'/'+req.body.thread_id);
      
    }
    
    this.reportReply = (req, res) => {
      let board = req.params.board;
      mongo.connect(url, (err, db) => {
        db.collection('messageBoard')
          .findAndModify({
            _id: new ObjectId(req.body.thread_id),
            "replies._id": new ObjectId(req.body.reply_id)
          }, [], { $set: { "replies.$.reported": true }}, (err, doc) => {})
      });
      res.send('reported');
    }
    
    this.deleteReply = (req, res) => {
      let board = req.params.board;
      mongo.connect(url, (err, db) => {
        db.collection('messageBoard')
          .findAndModify({
            _id: new ObjectId(req.body.thread_id),
            replies: { $elemMatch: { _id: new ObjectId(req.body.reply_id), delete_password: req.body.delete_password } },
          }, [], {}, {$set: { "replies.$.text": "[deleted]" }}, (err, doc) => {
            if(doc.value!==null) {
              res.send('success');
            } else {
              res.send('invalid password');
            }
          })            
      });
    }
  };

module.exports = ReplyHandler;
