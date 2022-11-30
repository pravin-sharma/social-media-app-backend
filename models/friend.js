const mongoose = require("mongoose");

const friendSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  friends: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
    }
  ]
});

module.exports = mongoose.model("Friend", friendSchema);
