const User = require("../models/user");
const CustomError = require("../utils/CustomError");
const Profile = require("../models/profile");
const Friend = require("../models/friend");
const mailer = require("../utils/mailer");
const crypto = require("crypto");
const { futureDateGenerate } = require("../utils/dateUtil");
const { default: mongoose } = require("mongoose");

//sign up
//TODO: send verification mail to user on sign up
exports.signUp = async (req, res, next) => {
  const { name, username, email, password, baseUrl } = req.body;

  if (!name || !username || !email || !password)
    return next(CustomError.badRequest("Please provide all the fields"));

  try {
    //check if user with same email already exists
    const emailExists = await User.findOne({ email: email.toLowerCase() });
    if (emailExists) {
      return next(
        CustomError.badRequest(`User with email: ${email} already exists`)
      );
    }

    //check if user with same username already exists
    const usernameExists = await User.findOne({
      username: username.toLowerCase(),
    });
    if (usernameExists) {
      return next(
        CustomError.badRequest(`Username: ${username} already exists`)
      );
    }

    // create user
    const user = await User.create({
      name,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password,
    });
    user.password = undefined;

    // create profile
    await Profile.create({
      user: user._id,
    });

    // create friends
    await Friend.create({
      user: user._id,
    });

    //send email verification mail to the user
    mailer({ type: "emailVerification", user, baseUrl });

    return res.status(200).json({
      success: true,
      message: "User Sign Up Successful",
      user,
    });
  } catch (error) {
    return next(error);
  }
};

// check if username already exists
exports.usernameExists = async (req, res, next) => {
  const username = req.params.username;

  try {
    const user = await User.findOne({ username: username.toLowerCase() });

    if (user) {
      return next(CustomError.badRequest("Username not available"));
    }

    return res.status(200).json({
      success: true,
      message: "Username available",
    });
  } catch (error) {
    return next(error);
  }
};

//login
exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(CustomError.badRequest("Please fill all the fields"));
  }

  try {
    //check if email exists
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.log(`User with ${email} does not exist`);
      return next(CustomError.unauthorized("Email or password incorrect"));
    }

    // check if user is verified
    if (!user.isVerified) {
      return next(
        CustomError.unauthorized(
          "Email is not verified, kindly verify you email address"
        )
      );
    }

    //check is user is disabled
    if (user.isDisabled) {
      return next(
        CustomError.forbidden(
          "The user is disabled/under review by the Admin. Kindly contact the Admin."
        )
      );
    }

    const isPasswordValid = await user.isPasswordValid(password);
    if (!isPasswordValid) {
      return next(CustomError.unauthorized("Email or password incorrect"));
    }

    //create jwt
    const token = user.getJwt();

    return res.status(200).json({
      success: true,
      message: `Login Successful for Email: ${email}`,
      token,
      loggedInUserId: user._id
    });
  } catch (error) {
    return next(error);
  }
};

// get logged in user
exports.getUser = async (req, res, next) => {
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return next(
        CustomError.unauthorized(
          "User does not exist. PLease login with valid credentials"
        )
      );
    }

    user.password = undefined;

    return res.status(200).json({
      success: true,
      message: "User Found",
      user,
    });
  } catch (error) {
    return next(new Error(error));
  }
};

//update user - self
//TODO: on updating email, change isVerified to false, logout the user and ask user to verify the new email
exports.updateUser = async (req, res, next) => {
  const userId = req.user.id;

  const updatePayload = {
    profilePicUrl: req.body.profilePicUrl,
    name: req.body.name,
    username: req.body.username?.toLowerCase(),
    email: req.body.email?.toLowerCase(),
    password: req.body.password || undefined,
  }

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      updatePayload,
      {
        new: true,
        runValidators: true,
        fields: "name email username profilePicUrl createdAt",
      }
    );

    

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      user,
    });
  } catch (error) {
    //Handle duplicate key error by mongo db
    if (error.code == 11000) {
      return next(
        CustomError.badRequest(
          `${Object.keys(error.keyValue)[0]} should be unique`
        )
      );
    }
    return next(error);
  }
};

// get user profile - by id
exports.getUserById = async (req, res, next) => {
  const userId = req.params.userId;

  if (!userId) {
    return next(CustomError.badRequest("Please provide user id"));
  }

  try {
    const user = await User.findById(userId, 'name email username profilePicUrl createdAt');

    //TODO: integrate profile model: user bio, dob, gender, workplace, Education

    if (!user) {
      return next(
        CustomError.badRequest("User with provided ID does not exists")
      );
    }

    return res.status(200).json({
      success: true,
      message: "User found",
      user,
    });
  } catch (error) {
    return next(error);
  }
};

//email verification
exports.emailVerification = async (req, res, next) => {
  const {verificationCode } = req.body

  if (!verificationCode) {
    return next(CustomError.badRequest("Invalid Email Verification Token"));
  }

  try {
    const user = await User.findOne({ verificationToken: verificationCode });

    if (!user) {
      return next(CustomError.unauthorized("Invalid Email Verification Token"));
    }

    user.isVerified = true;
    user.verificationToken = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `Email: ${user.email} verified`,
    });
  } catch (error) {
    return next(error);
  }
};

//initiate password reset
//input: email
//output: password reset token and page url for resetting password
exports.initPasswordReset = async (req, res, next) => {
  const { email, passwordResetUrl } = req.body;

  if (!email) {
    return next(
      CustomError.badRequest("Please enter email address for password reset")
    );
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return next(
        CustomError.badRequest(`User with Email: ${email} does not exists`)
      );
    }

    user.resetPasswordExpire = futureDateGenerate(1);
    user.resetPasswordToken = crypto.randomBytes(20).toString("hex");

    await user.save();

    await mailer({ type: "initPasswordReset", user, passwordResetUrl });

    return res.status(200).json({
      success: true,
      message: `Password reset mail sent to your registered email: ${user.email}`,
    });
  } catch (error) {
    return next(error);
  }
};

//perform password reset
exports.perfPasswordReset = async (req, res, next) => {
  const { email, resetPasswordToken, newPassword } = req.body;

  if (!email || !resetPasswordToken || !newPassword) {
    return next(CustomError.badRequest("Please enter all fields"));
  }

  try {
    const user = await User.findOne({ email });

    if (!email) {
      return next(
        CustomError.badRequest(`User with email: ${email} does not exist`)
      );
    }

    //check if resetPasswordToken exists on user
    if (!user.resetPasswordToken) {
      return next(
        CustomError.badRequest(`Invalid Password Reset Token/Token expired`)
      );
    }

    //check if resetPasswordToken expired
    let tokenExpiryTime = user.resetPasswordExpire.getTime();
    let currentTime = new Date().getTime();
    if (tokenExpiryTime < currentTime) {
      return next(
        CustomError.badRequest("Password Reset Token expired. Please Try Again")
      );
    }

    //Compare resetPasswordToken
    if (resetPasswordToken != user.resetPasswordToken) {
      return next(CustomError.badRequest("Invalid Password Reset Token"));
    }

    //Set Token and expiry to undefined, and reset the password
    user.resetPasswordExpire = undefined;
    user.resetPasswordToken = undefined;
    user.password = newPassword;

    await user.save();

    return res.status(200).json({
      success: true,
      message: `Password Reset Successful`,
    });
  } catch (error) {
    return next(error);
  }
};

// get all users
// @Output: all users, except admin and self
exports.getAllUser = async (req, res, next) => {
  const userId = req.user.id;

  try {
    const users = await User.find(
      { role: { $ne: "admin" }, _id: { $ne: userId } },
      { name: 1, email: 1, username: 1, profilePicUrl: 1 }
    ).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      message: users.length > 0 ? `Users Found` : `No Users Found`,
      users,
    });
  } catch (error) {
    return next(error);
  }
};

// delete user
exports.deleteUser = async (req, res, next) => {
  const userId = req.params.userId;
  try {
    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return next(CustomError.badRequest("User does not exists"));
    }

    return res.status(200).json({
      success: true,
      message: `User with email: ${user.email} is deleted successfully`,
      user,
    });
  } catch (error) {
    return next(error);
  }
};

// disable user
exports.disableUser = async (req, res, next) => {
  const userId = req.params.userId;

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { isDisabled: true },
      {
        new: true,
        runValidators: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: `User with email: ${user.email} is Disabled`,
      user,
    });
  } catch (error) {
    return next(error);
  }
};

// enable user
exports.enableUser = async (req, res, next) => {
  const userId = req.params.userId;

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { isDisabled: false },
      {
        new: true,
        runValidators: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: `User with email: ${user.email} is Enabled`,
      user,
    });
  } catch (error) {
    return next(error);
  }
};
