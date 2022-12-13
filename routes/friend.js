const { Router } = require("express");
const { isAuth } = require("../middleware/isAuth");
const router = Router();

const { sendFriendRequest, acceptFriendRequest, declineFriendRequest, removeFriend, getAllFriendRequests, getAllFriends, getAllFriendsById, withDrawFriendRequest, getSentRequests } = require('../controllers/friend')

// send a friend request
router.post('/friend', isAuth, sendFriendRequest);

router.delete('/friend/withDraw/:to', isAuth, withDrawFriendRequest);

// accept a friend request
router.post('/friend/accept', isAuth, acceptFriendRequest);

// decline a friend request
router.delete('/friend/decline/:from', isAuth, declineFriendRequest);

// remove a friend
router.delete('/friend/remove/:friendId', isAuth, removeFriend)

// get all pending friend requests
router.get('/friend/requests', isAuth, getAllFriendRequests)

// get all friends
router.get('/friend/all', isAuth, getAllFriends)

// get all friends by id
router.get('/friend/all/:id', isAuth, getAllFriendsById)

// get sent friend requests
router.get('/friend/sentRequests', isAuth, getSentRequests);

module.exports = router;