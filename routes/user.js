const { Router } = require("express");
const router = Router();

const {
  signUp,
  login,
  getUser,
  updateUser,
  emailVerification,
  initPasswordReset,
  perfPasswordReset,
  getAllUser,
  deleteUser,
  disableUser,
  enableUser,
  getUserById
} = require("../controllers/user");
const { isAdmin } = require("../middleware/isAdmin");
const { isAuth } = require("../middleware/isAuth");

router.post("/signup", signUp);
router.post("/login", login);

//Get Logged In User
router.get("/user", isAuth, getUser);

//Update Logged In User
router.put("/user", isAuth, updateUser);

// email verification
router.get("/user/verify/:verificationHash", emailVerification);

// initiate password reset
router.post("/user/passwordReset", initPasswordReset);

//perform Password Reset
router.post("/user/passwordResetPerform", perfPasswordReset);

// view all users except admin
router.get("/user/all", isAuth, getAllUser);

// get a user by id
router.get("/user/:userId", isAuth, getUserById);

//admin
//delete user
router.delete("/user/:userId", isAuth, isAdmin, deleteUser);

//disable user
router.get("/user/disable/:userId", isAuth, isAdmin, disableUser);

//enable user
router.get("/user/enable/:userId", isAuth, isAdmin, enableUser);

module.exports = router;
