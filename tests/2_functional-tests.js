/*
 *
 *
 *       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
 *       -----[Keep the tests in the same order!]-----
 *       (if additional are added, keep them at the very end!)
 */

var chaiHttp = require("chai-http");
var chai = require("chai");
var assert = chai.assert;
var server = require("../server");

chai.use(chaiHttp);

suite("Functional Tests", function() {
  this.timeout(5000);
  let id1, id2, replyId;

  suite("API ROUTING FOR /api/threads/:board", function() {
    suite("POST", function() {
      test("Create a thread", done => {
        chai
          .request(server)
          .post("/api/threads/testboard")
          .send({ text: "FCC-Testing", delete_password: "test" })
          .end((err, res) => {
            assert.equal(res.status, 200);
          });
        chai
          .request(server)
          .post("/api/threads/testboard")
          .send({ text: "FCC-Testing-2", delete_password: "test2" })
          .end((err, res) => {
            assert.equal(res.status, 200);
            done();
          });
      });
    });

    suite("GET", function() {
      test("Get array of threads", done => {
        chai
          .request(server)
          .get("/api/threads/testboard")
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.isArray(res.body);
            assert.isBelow(res.body.length, 11);
            assert.property(res.body[0], "_id");
            assert.property(res.body[0], "created_on");
            assert.property(res.body[0], "bumped_on");
            assert.property(res.body[0], "text");
            assert.property(res.body[0], "replies");
            assert.notProperty(res.body[0], "reported");
            assert.notProperty(res.body[0], "delete_password");
            assert.isArray(res.body[0].replies);
            assert.isBelow(res.body[0].replies.length, 4);
            id1 = res.body[0]._id;
            id2 = res.body[1]._id;
            done();
          });
      });
    });

    suite("DELETE", function() {
      test("Delete thread with incorrect password", done => {
        chai
          .request(server)
          .delete("/api/threads/testboard")
          .send({ thread_id: id2, delete_password: "wrong" })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, "Error - Incorrect password");
            done();
          });
      });

      test("Delete thread with correct password", done => {
        chai
          .request(server)
          .delete("/api/threads/testboard")
          .send({ thread_id: id1, delete_password: "test2" })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, "Deleted");
            done();
          });
      });
    });

    suite("PUT", function() {
      test("Report thread", done => {
        chai
          .request(server)
          .put("/api/threads/testboard")
          .send({ thread_id: id2 })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, "Reported");
            done();
          });
      });
    });
  });

  suite("API ROUTING FOR /api/replies/:board", function() {
    suite("POST", function() {
      test("reply", done => {
        chai
          .request(server)
          .post("/api/replies/testboard")
          .send({ thread_id: id2, text: "hello", delete_password: "delete" })
          .end((err, res) => {
            assert.equal(res.status, 200);
            done();
          });
      });
    });

    suite("GET", function() {
      test("Get all replies for a thread", done => {
        chai
          .request(server)
          .get("/api/replies/testboard/")
          .query({ thread_id: id2 })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.property(res.body, "_id");
            assert.property(res.body, "created_on");
            assert.property(res.body, "bumped_on");
            assert.property(res.body, "text");
            assert.property(res.body, "replies");
            assert.notProperty(res.body, "reported");
            assert.notProperty(res.body, "delete_password");
            assert.isArray(res.body.replies);
            assert.notProperty(res.body.replies[0], "reported");
            assert.notProperty(res.body.replies[0], "delete_password");
            assert.equal(res.body.replies[0].text, "hello");
            replyId = res.body.replies[0]._id;
            done();
          });
      });
    });

    suite("PUT", function() {
      test("Report reply", done => {
        chai
          .request(server)
          .put("/api/replies/testboard")
          .send({ thread_id: id2, reply_id: replyId })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, "Reported");
            done();
          });
      });
    });

    suite("DELETE", function() {
      test("Delete reply with incorrect password", done => {
        chai
          .request(server)
          .delete("/api/replies/testboard")
          .send({
            thread_id: id2,
            reply_id: replyId,
            delete_password: "wrong_password"
          })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, "Error - Incorrect password");
            done();
          });
      });

      test("Delete reply with correct password", done => {
        chai
          .request(server)
          .delete("/api/replies/testboard")
          .send({
            thread_id: id2,
            reply_id: replyId,
            delete_password: "delete"
          })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, "Deleted");
            done();
          });
      });
    });
  });

  suite("Clean up", function() {
    test("Delete thread in order to keep DB clean", done => {
      chai
        .request(server)
        .delete("/api/threads/testboard")
        .send({ thread_id: id2, delete_password: "test" })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.text, "Deleted");
          done();
        });
    });
  });
});
