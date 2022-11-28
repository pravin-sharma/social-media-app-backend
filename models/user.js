const mongoose = require("mongoose");
const { isEmail } = require("validator");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter name"],
    },
    email: {
      type: String,
      required: [true, "Please enter email"],
      unique: [true, "Email should be unique"],
      validate: [isEmail, "Please enter email with proper format"],
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      select: false,
    },
    username: {
      type: String,
      required: [true, "Please provide an username"],
      unique: true,
      trim: true,
    },
    profilePicUrl: {
      type: String,
      default: "https://www.gravatar.com/avatar/?d=mp",
    },
    role: {
      type: String,
      default: "user",
      enum: ["user", "root"],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
