const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    bio: { type: String },
    dob: {
      type: Date
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other']
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Profile", profileSchema);
