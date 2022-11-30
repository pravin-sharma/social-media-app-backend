const mongoose = require("mongoose");
const { isEmail } = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

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
    },
    username: {
      type: String,
      required: [true, "Please provide an username"],
      unique: true,
      trim: true,
      minLength: 5
    },
    profilePicUrl: {
      type: String,
      default: "https://www.gravatar.com/avatar/?d=mp",
    },
    role: {
      type: String,
      default: "user",
      enum: ["user", "admin"],
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
    isDisabled: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

//hash password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

//hash password on update password
userSchema.pre("findOneAndUpdate", async function(next){
  //update password only when it is modified
  if(this._update.password){
    this._update.password = await bcrypt.hash(this._update.password, 10);
  }
  return next();
})

//generate verification token
//TODO: Also generate email verification hash when email is modified or new user
userSchema.pre("save", function (next) {
  if (this.isNew || this.isModified("email")) {
    this.isVerified = false;
    this.verificationToken = crypto.randomBytes(20).toString("hex");
  }
  return next();
});

//method - compare password
userSchema.method("isPasswordValid", async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
});

//generate jwt
userSchema.method("getJwt", function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRY,
  });
});

//password reset hash generate
// resetPasswordToken: String,
//     resetPasswordExpire: Date,
userSchema.method("setPasswordResetToken", function () {
  this.resetPasswordExpire = new Date();
  this.resetPasswordToken = crypto.randomBytes(20).toString("hex");
});

module.exports = mongoose.model("User", userSchema);
