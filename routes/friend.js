const { Router } = require("express");
const { isAuth } = require("../middleware/isAuth");
const router = Router();

const { sendFriendRequest, acceptFriendRequest, declineFriendRequest, removeFriend, getAllFriendRequests, getAllFriends } = require('../controllers/friend')

// send a friend request
router.post('/friend', isAuth, sendFriendRequest);

// accept a friend request
router.post('/friend/accept', isAuth, acceptFriendRequest);

// decline a friend request
router.delete('/friend/decline/:friendId', isAuth, declineFriendRequest);

// remove a friend
router.delete('/friend/remove/:friendId', isAuth, removeFriend)

// get all pending friend requests
router.get('/friend/requests', isAuth, getAllFriendRequests)

// get all friends
router.get('/friend/all', isAuth, getAllFriends)

module.exports = router;