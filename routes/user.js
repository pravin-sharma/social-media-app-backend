const { Router } = require('express');
const route = Router()

const {signUp, login, getUser, updateUser, emailVerification, initPasswordReset, perfPasswordReset, getAllUser, deleteUser, disableUser, enableUser} = require('../controllers/user');
const { isAdmin } = require('../middleware/isAdmin');
const { isAuth } = require('../middleware/isAuth');


route.post('/signup', signUp);
route.post('/login', login);

//Get Logged In User
route.get('/user', isAuth, getUser);

//Update Logged In User
route.put('/user', isAuth, updateUser);

// email verification
route.get('/user/verify/:verificationHash', emailVerification);

// initiate password reset
route.post('/user/passwordReset', initPasswordReset);

//perform Password Reset
route.post('/user/passwordResetPerform', perfPasswordReset);

// view all users except admin
route.get('/user/all', isAuth, getAllUser )

//admin 
//delete user
route.delete('/user/:userId', isAuth, isAdmin, deleteUser )

//disable user
route.get('/user/disable/:userId', isAuth, isAdmin, disableUser )

//enable user
route.get('/user/enable/:userId', isAuth, isAdmin, enableUser )

//disable post
//view all posts

module.exports = route


