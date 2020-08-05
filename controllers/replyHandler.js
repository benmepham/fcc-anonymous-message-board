const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectID;

const CONNECTION_STRING = process.env.DB;

function ReplyHandler() {
  this.replyList = function(req, res) {
    const board = req.params.board;
    MongoClient.connect(
      CONNECTION_STRING,
      { useUnifiedTopology: true },
      function(err, client) {
        if (err) return res.send(err);
        client
          .db("msgboard")
          .collection(board)
          .find(
            { _id: new ObjectId(req.query.thread_id) },
            {
              projection: {
                reported: 0,
                delete_password: 0,
                "replies.delete_password": 0,
                "replies.reported": 0
              }
            }
          )
          .toArray((err, replies) => {
            if (err) return res.send(err);
            res.json(replies[0]);
          });
      }
    );
  };

  this.newReply = function(req, res) {
    const board = req.params.board;
    const reply = {
      _id: new ObjectId(),
      text: req.body.text,
      created_on: new Date(),
      reported: false,
      delete_password: req.body.delete_password
    };
    MongoClient.connect(
      CONNECTION_STRING,
      { useUnifiedTopology: true },
      function(err, client) {
        if (err) return res.send(err);
        client
          .db("msgboard")
          .collection(board)
          .findOneAndUpdate(
            { _id: new ObjectId(req.body.thread_id) },
            { $set: { bumped_on: new Date() }, $push: { replies: reply } },
            err => {
              if (err) return res.send(err);
            }
          );
      }
    );
    res.redirect("/b/" + board + "/" + req.body.thread_id);
  };

  this.reportReply = function(req, res) {
    const board = req.params.board;
    MongoClient.connect(
      CONNECTION_STRING,
      { useUnifiedTopology: true },
      function(err, client) {
        if (err) return res.send(err);
        client
          .db("msgboard")
          .collection(board)
          .updateOne(
            {
              _id: new ObjectId(req.body.thread_id),
              "replies._id": new ObjectId(req.body.reply_id)
            },
            { $set: { "replies.$.reported": true } }, //updates first array element that matches query
            err => {
              if (err) return res.send(err);
              res.send("Reported");
            }
          );
      }
    );
  };

  this.deleteReply = function(req, res) {
    MongoClient.connect(
      CONNECTION_STRING,
      { useUnifiedTopology: true },
      function(err, client) {
        if (err) return res.send(err);
        client
          .db("msgboard")
          .collection(req.params.board)
          .findOneAndUpdate(
            //UpdateOne does not return result
            {
              _id: new ObjectId(req.body.thread_id),
              replies: {
                $elemMatch: {
                  _id: new ObjectId(req.body.reply_id),
                  delete_password: req.body.delete_password
                }
              } // Matches array element
            },
            { $set: { "replies.$.text": "[deleted]" } }, //updates first array element that matches query
            (err, result) => {
              if (err) return res.send(err);
              if (result.value === null)
                return res.send("Error - Incorrect password");
              res.send("Deleted");
              //res.redirect("/" + board + "/")
            }
          );
      }
    );
  };
}

module.exports = ReplyHandler;
