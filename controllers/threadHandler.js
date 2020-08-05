const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectID;

const CONNECTION_STRING = process.env.DB;

function ThreadHandler() {
  this.threadList = (req, res) => {
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
            {},
            {
              projection: {
                reported: 0,
                delete_password: 0,
                "replies.delete_password": 0,
                "replies.reported": 0
              }
            }
          )
          .sort({ bumped_on: -1 }) // 10 latest threads
          .limit(10)
          .toArray((err, threads) => {
            if (err) return res.send(err);
            threads.forEach(thread => {
              thread.replycount = thread.replies.length;
              if (thread.replies.length > 3)
                thread.replies = thread.replies.slice(-3); //only latest 3
            });
            res.json(threads);
          });
      }
    );
  };

  this.newThread = (req, res) => {
    const board = req.params.board;
    const thread = {
      text: req.body.text,
      created_on: new Date(),
      bumped_on: new Date(),
      reported: false,
      delete_password: req.body.delete_password,
      replies: []
    };
    MongoClient.connect(
      CONNECTION_STRING,
      { useUnifiedTopology: true },
      function(err, client) {
        if (err) return res.send(err);
        client
          .db("msgboard")
          .collection(board)
          .insertOne(thread, err => {
            if (err) return res.send(err);
            res.redirect("/b/" + board + "/");
          });
      }
    );
  };

  this.reportThread = (req, res) => {
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
              _id: new ObjectId(req.body.thread_id)
            },
            { $set: { reported: true } },
            err => {
              if (err) return res.send(err);
              res.send("Reported");
            }
          );
      }
    );
  };

  this.deleteThread = (req, res) => {
    const board = req.params.board;
    MongoClient.connect(
      CONNECTION_STRING,
      { useUnifiedTopology: true },
      function(err, client) {
        if (err) return res.send(err);
        client
          .db("msgboard")
          .collection(board)
          .findOneAndDelete( //UpdateOne does not return result
            {
              _id: new ObjectId(req.body.thread_id),
              delete_password: req.body.delete_password
            },
            (err, result) => {
              if (err) return res.send(err);
              if (result.value === null)
                return res.send("Error - Incorrect password");
              res.send("Deleted");
            }
          );
      }
    );
  };
}

module.exports = ThreadHandler;
