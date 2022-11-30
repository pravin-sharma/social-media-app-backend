const CustomError = require("../utils/CustomError");

exports.isAdmin = async (req, res, next) => {
  if (req.user.role != "admin") {
    return next(
      CustomError.forbidden(`You are not authorized to perform this action`)
    );
  }
  return next();
};
