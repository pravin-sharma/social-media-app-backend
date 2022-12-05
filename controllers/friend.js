const { default: mongoose } = require("mongoose");
const Friend = require("../models/friend");
const CustomError = require("../utils/CustomError");

// send a friend request
exports.sendFriendRequest = async (req, res, next) => {
  const from = req.user.id;
  const { to } = req.body;

  if (!to) {
    return next(
      CustomError.badRequest(
        "Please mention ID to whom you want to send the request"
      )
    );
  }

  try {
    const friend = await Friend.findOne({ user: mongoose.Types.ObjectId(to) });

    if (!friend) {
      return next(CustomError.badRequest("No user with that ID found"));
    }

    //if request already sent
    const alreadyRequested = friend.friendRequests.filter(
      (request) => request.user == from
    );

    if (alreadyRequested.length) {
      // TODO: you can add logic to withdraw the request logic here later
      return next(CustomError.badRequest("Request already sent to this user"));
    }

    //push the 'from' user in friend request
    friend.friendRequests.push({ user: from });

    await friend.save();

    return res.status(200).json({
      success: true,
      message: "Friend Request sent.",
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

    const [newFriend] = friend.friendRequests.filter(
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
    friend.friends.push({user: userId});
    await friend.save();

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
  const friendId = req.params.friendId;

  if (!friendId) {
    return next(
      CustomError.badRequest(
        "Please send friendId for declining the friend request"
      )
    );
  }

  try {
    const friend = await Friend.findOne({ user: userId });

    const requestExists = friend.friendRequests.filter(
      (request) => request.user == friendId
    );

    if (!requestExists.length) {
      return next(
        CustomError.badRequest("No such user's friend request exists")
      );
    }

    friend.friendRequests = friend.friendRequests.filter(
      (f) => f.user != friendId
    );

    await friend.save();

    return res.status(200).json({
      success: true,
      message: "Request Declined",
      friendRequests: friend.friendRequests,
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
    friend = await Friend.findOne({user: friendId});
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
    const { friendRequests } = await Friend.findOne(
      { user: userId },
      { friendRequests: 1 }
    ).populate("friendRequests.user", "_id name email username profilePicUrl");

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

// get all friends
exports.getAllFriends = async (req, res, next) => {
  const userId = req.user.id;

  try {
    const { friends } = await Friend.findOne(
      { user: userId },
      { friends: 1 }
    ).populate("friends.user", "_id name username email profilePicUrl");

    return res.status(200).json({
      success: true,
      message: friends.length ? "Friends Found" : "No Friends Found",
      friends,
    });
  } catch (error) {
    return next(error);
  }
};
