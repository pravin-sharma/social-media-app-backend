
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const CustomError = require("../utils/CustomError");

exports.isAuth = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return next(CustomError.unauthorized("Please login first to proceed"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      console.log("JWT Malformed");
      return next(CustomError.unauthorized("Please login first to proceed"));
    }
  } catch (error) {
    return next(new Error(error));
  }
  return next();
};