const { default: mongoose } = require("mongoose");
const Friend = require("../models/friend");
const User = require("../models/user");
const CustomError = require("../utils/CustomError");

// send/withdraw a friend request
exports.sendFriendRequest = async (req, res, next) => {
  const userId = req.user.id;
  const { to } = req.body;

  if (!to) {
    return next(
      CustomError.badRequest(
        "Please mention ID to whom you want to send the request"
      )
    );
  }

  try {
    const userToWhichRequestIsSent = await User.findById(
      mongoose.Types.ObjectId(to),
      "name profilePicUrl"
    );

    if (!userToWhichRequestIsSent) {
      return next(CustomError.badRequest("No user with that ID found"));
    }

    // friend obj of the user to whom we want to send the friend request
    const friendObj = await Friend.findOne({
      user: mongoose.Types.ObjectId(to),
    });

    // logged in user's friend object
    const loggedUserFriendObj = await Friend.findOne({
      user: mongoose.Types.ObjectId(userId),
    });

    // adding request to loggedIn user sent requests
    loggedUserFriendObj.sentFriendRequests.push({ user: to });

    // adding request to pending requests of another user
    friendObj.friendRequests.push({ user: userId });

    await loggedUserFriendObj.save();
    await friendObj.save();

    return res.status(200).json({
      success: true,
      message: "Friend Request sent.",
      userToWhichRequestIsSent,
    });
  } catch (error) {
    return next(error);
  }
};

exports.withDrawFriendRequest = async (req, res, next) => {
  const userId = req.user.id;
  const { to } = req.params;

  if (!to) {
    return next(
      CustomError.badRequest(
        "Please mention ID to whom you want to send the request"
      )
    );
  }

  try {
    const userFromWhichWithdrawFriendRequest = await User.findById(
      mongoose.Types.ObjectId(to),
      "name profilePicUrl"
    );

    if (!userFromWhichWithdrawFriendRequest) {
      return next(CustomError.badRequest("No user with that ID found"));
    }

    // friend obj of the user from whom we want to withdraw the friend request
    const friendObj = await Friend.findOne({
      user: mongoose.Types.ObjectId(to),
    });

    // logged in user's friend object
    const loggedUserFriendObj = await Friend.findOne({
      user: mongoose.Types.ObjectId(userId),
    });

    //remove request from the loggedIn User
    loggedUserFriendObj.sentFriendRequests =
      loggedUserFriendObj.sentFriendRequests.filter(
        (sentRequest) => sentRequest.user != to
      );

    await loggedUserFriendObj.save();

    //remove request from user to whom friend request was sent
    friendObj.friendRequests = friendObj.friendRequests.filter(
      (request) => request.user != userId
    );

    await friendObj.save();

    return res.status(200).json({
      success: true,
      message: "Withdrawn the friend request",
      userFromWhichWithdrawFriendRequest,
    });
  } catch (error) {
    return next(error);
  }
};

// accept a friend request
exports.acceptFriendRequest = async (req, res, next) => {
  const userId = req.user.id;
  const { requesterUserId } = req.body;

  if (!requesterUserId) {
    return next(CustomError.badRequest("Please send requester user id"));
  }

  try {
    let friend = await Friend.findOne({ user: userId });

    if (!friend) {
      throw error("something went wrong, unable to get friend object");
    }

    let [newFriend] = friend.friendRequests.filter(
      (request) => request.user == requesterUserId
    );

    if (!newFriend) {
      return next(CustomError.badRequest("No such Friend request exist"));
    }

    //remove from friend requests list
    friend.friendRequests = friend.friendRequests.filter(
      (request) => request.user.toString() != newFriend.user.toString()
    );

    //add to accepter's friends list
    friend.friends.push({ user: newFriend.user });
    await friend.save();

    // add to requester's friend list
    friend = await Friend.findOne({ user: requesterUserId });
    friend.friends.push({ user: userId });

    // remove for requester's sent friend request list
    friend.sentFriendRequests = friend.sentFriendRequests.filter((request) => {
      console.log(request);
      return request.user != userId;
    });

    await friend.save();

    //get new friend data
    newFriend = await User.findOne(
      { _id: newFriend.user },
      "name profilePicUrl"
    );

    return res.status(200).json({
      success: true,
      message: "Accepted the friend request.",
      newFriend,
    });
  } catch (error) {
    return next(error);
  }
};

// decline a friend request
exports.declineFriendRequest = async (req, res, next) => {
  const userId = req.user.id;
  const from = req.params.from;

  if (!from) {
    return next(
      CustomError.badRequest(
        "Please send friendId for declining the friend request"
      )
    );
  }

  try {
    // logged user friend obj
    let friend = await Friend.findOne({ user: userId });

    const requestExists = friend.friendRequests.filter(
      (request) => request.user == from
    );

    if (!requestExists.length) {
      return next(
        CustomError.badRequest("No such user's friend request exists")
      );
    }

    // remove request from logged user's friend request list
    friend.friendRequests = friend.friendRequests.filter((f) => f.user != from);
    await friend.save();

    // remove request from other user's sent friend request list
    friend = await Friend.findOne({ user: from });
    friend.sentFriendRequests = friend.sentFriendRequests.filter(
      (request) => request.user != userId
    );
    await friend.save();

    return res.status(200).json({
      success: true,
      message: "Request Declined",
    });
  } catch (error) {
    return next(error);
  }
};

// remove a friend
exports.removeFriend = async (req, res, next) => {
  const userId = req.user.id;
  const friendId = req.params.friendId;

  if (!friendId) {
    return next(
      CustomError.badRequest("Please specify friend which is to be removed")
    );
  }

  try {
    let friend = await Friend.findOne({ user: userId }, { friends: 1 });

    //check if the friend exists in the friend's list
    const exists = friend.friends.filter((f) => f.user == friendId);
    if (!exists.length) {
      return next(
        CustomError.badRequest(
          "Friend with such friendId does not exists in the friends list"
        )
      );
    }

    friend.friends = friend.friends.filter((f) => f.user != friendId);
    await friend.save();

    // remove yourself from your removed friend's friend list
    friend = await Friend.findOne({ user: friendId });
    friend.friends = friend.friends.filter((f) => f.user != userId);
    await friend.save();

    return res.status(200).json({
      success: true,
      message: "Removed a friend",
    });
  } catch (error) {
    return next(error);
  }
};

// get all pending friend requests
exports.getAllFriendRequests = async (req, res, next) => {
  const userId = req.user.id;

  try {
    let { friendRequests } = await Friend.findOne(
      { user: userId },
      { friendRequests: 1 }
    ).populate("friendRequests.user", "_id name profilePicUrl isDisabled");

    //filter delete users
    friendRequests = friendRequests.filter((request) => (request.user != null && !request.user?.isDisabled));

    return res.status(200).json({
      success: true,
      message: friendRequests.length
        ? "Pending Friend Requests found"
        : "No pending friend request",
      friendRequests,
    });
  } catch (error) {
    return next(error);
  }
};

// get all friends - logged in user - not being used
exports.getAllFriends = async (req, res, next) => {
  const userId = req.user.id;

  try {
    let { friends } = await Friend.findOne(
      { user: userId },
      { friends: 1 }
    ).populate("friends.user", "_id name username email profilePicUrl");

    friends = friends.filter((friend) => friend.user != null);

    return res.status(200).json({
      success: true,
      message: friends.length ? "Friends Found" : "No Friends Found",
      friends,
    });
  } catch (error) {
    return next(error);
  }
};

// get all friends - by user id - other user
exports.getAllFriendsById = async (req, res, next) => {
  const userId = req.params.id;

  try {
    let { friends } = await Friend.findOne(
      { user: userId },
      { friends: 1 }
    ).populate("friends.user", "_id name profilePicUrl isDisabled");

    // filter deleted and disabled users
    friends = friends.filter((friend) => (friend.user != null && !friend.user?.isDisabled));

    return res.status(200).json({
      success: true,
      message: friends.length ? "Friends Found" : "No Friends Found",
      friends,
    });
  } catch (error) {
    return next(error);
  }
};

// get all sent friend requests
exports.getSentRequests = async (req, res, next) => {
  const userId = req.user.id;

  try {
    let { sentFriendRequests } = await Friend.findOne(
      { user: userId },
      { sentFriendRequests: 1 }
    ).populate("sentFriendRequests.user", "name username email profilePicUrl");

    sentFriendRequests = sentFriendRequests.filter(
      (request) => request.user != null
    );

    return res.status(200).json({
      success: true,
      message: sentFriendRequests.length
        ? "Sent Friend Requests Found"
        : "No Friend Requests Sent",
      sentFriendRequests,
    });
  } catch (error) {
    return next(error);
  }
};
