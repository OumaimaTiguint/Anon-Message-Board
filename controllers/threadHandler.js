const mongo = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectID;
const url = process.env.DB;

function ThreadHandler() {
    
    this.threadList = (req, res) => {
      let board = req.params.board;
      mongo.connect(url, (err, db) => {
        db.collection('messageBoard')
          .find({},
            {
            reported: 0,
            delete_password: 0,
            "replies.delete_password": 0,
            "replies.reported": 0
            })
          .sort({bumped_on: -1})
          .limit(10)
          .toArray(function(err,docs){
            docs.forEach(function(doc){
              doc.replycount = doc.replies.length;
              if(doc.replies.length > 3) {
                doc.replies = doc.replies.slice(-3);
              }
            });
            res.json(docs);
        });
      });
    }
    
    this.newThread = (req, res) => {
      let board = req.params.board;
      const thread = {
        text: req.body.text,
        created_on: new Date(),
        bumped_on: new Date(),
        reported: false,
        delete_password: req.body.delete_password,
        replies: []
      };
      
      mongo.connect(url, (err, db) => {
        db.collection('messageBoard')
          .insert(thread, ()=> {
            res.redirect('/b/'+board+'/');
          })
      });
    }
    
    this.reportThread = (req, res) => {
      let board = req.params.board;
      mongo.connect(url, (err, db) => {
        db.collection('messageBoard')
          .findAndModify({
            _id: new ObjectId(req.body.thread_id),
            delete_password: req.body.delete_password
          }, [], {$set: {reported: true}}, (err, doc) => {})
      });
      res.send('reported');
    }
    
    this.deleteThread = (req, res) => {
      let board = req.params.board;
      mongo.connect(url, (err, db) => {
        db.collection('messageBoard')
          .findAndModify({
            _id: new ObjectId(req.body.thread_id),
            delete_password: req.body.delete_password
          }, [], {}, {remove: true, new: false}, (err, doc) => {
            if(doc.value!==null) {
              res.send('success');
            } else {
              res.send('invalid password');
            }
          })            
      });
    }
  };

module.exports = ThreadHandler;