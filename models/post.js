const mongoose = require("mongoose");

// TODO: Change visibility default to private later
const postSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
    mediaUrl: {
      type: String,
    },
    caption: {
      type: String,
    },
    likes: {
      type: [{ user: { type: mongoose.Types.ObjectId, ref: "User" } }],
    },
    comments: {
      type: [
        {
          user: { type: mongoose.Types.ObjectId, ref: "User" },
          text: { type: String },
          date: { type: Date, default: new Date() },
        },
      ],
    },
    visibility: {
      type: String,
      enum: ["private", "public"],
      default: "public",
    },
    isDisabled: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Post", postSchema);
