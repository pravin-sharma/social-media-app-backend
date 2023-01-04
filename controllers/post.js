const { default: mongoose } = require("mongoose");
const Friend = require("../models/friend");
const Post = require("../models/post");
const CustomError = require("../utils/CustomError");

// add
exports.addPost = async (req, res, next) => {
  const userId = req.user.id;
  const { mediaUrl, mediaType, caption, visibility } = req.body;

  if (!mediaUrl && !caption) {
    return next(CustomError.badRequest(`Please add a media/caption to post`));
  }

  try {
    let post = await Post.create({
      user: userId,
      mediaUrl,
      caption,
      visibility,
      mediaType,
    });

    post._doc.user = {
      _id: req.user.id,
      name: req.user.name,
      profilePicUrl: req.user.profilePicUrl,
    };

    return res.status(200).json({
      success: true,
      message: `Post Created`,
      post,
    });
  } catch (error) {
    return next(error);
  }
};

// update post
exports.updatePost = async (req, res, next) => {
  const userId = req.user.id;
  const postId = req.params.postId;

  const updatePayload = req.body;

  try {
    const post = await Post.findByIdAndUpdate(postId, updatePayload, {
      new: true,
      runValidators: true,
    });

    const updatedPost = await Post.findById(postId).populate(
      "user likes.user comments.user",
      "name profilePicUrl"
    );

    res.status(200).json({
      success: true,
      message: "Post updated successfully",
      post: updatedPost,
    });
  } catch (error) {
    return next(error);
  }
};

// show all posts - by userId - user based post
exports.getAllPostsByUserId = async (req, res, next) => {
  const loggedUserId = req.user.id;
  const loggedUserRole = req.user.role;
  const userId = req.params.userId;

  let posts = [];

  try {
    if (loggedUserRole == "user") {
      //get friends of logged in user
      const { friends } = await Friend.findOne({ user: loggedUserId });

      //check if we are checking our own profile posts
      const isCheckingOwnPosts = loggedUserId.toString() == userId;

      //check if we have this user as our friend
      const isFriendArr = friends.filter(
        (friend) => friend.user.toString() == userId
      );
      const isFriend = isFriendArr.length ? true : false;

      let dynamicQuery = { visibility: "public" };

      // not friend, not own profile
      if (!isFriend && !isCheckingOwnPosts) {
        dynamicQuery = { visibility: "public" };
      } else {
        dynamicQuery = {};
      }

      posts = await Post.find({
        user: userId,
        ...dynamicQuery,
        isDisabled: false,
      })
        .populate(
          "user likes.user comments.user",
          "name profilePicUrl isDisabled"
        )
        .sort({ createdAt: -1 });
    }

    if (loggedUserRole == "admin") {
      posts = await Post.find({ user: userId })
        .populate(
          "user likes.user comments.user",
          "name profilePicUrl isDisabled"
        )
        .sort({ createdAt: -1 });
    }

    //filtering all the posts and the likes and comments the belongs to deleted or disabled user
    //filtering posts
    for (let i = 0; i < posts.length; i++) {
      //post
      let post = posts[i];
      if (post.user == null || post.user.isDisabled) {
        posts.splice(i, 1);
        i = i - 1;
        continue;
      } else {
        //likes
        let likes = post.likes;
        for (let i = 0; i < likes.length; i++) {
          let like = likes[i];
          if (like.user == null || like.user.isDisabled) {
            likes.splice(i, 1);
            i = i - 1;
          }
        }

        //comments
        let comments = post.comments;
        for (let i = 0; i < comments.length; i++) {
          let comment = comments[i];
          if (comment.user == null || comment.user.isDisabled) {
            comments.splice(i, 1);
            i = i - 1;
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: posts.length > 0 ? "Posts Found" : "No Posts Found",
      posts,
    });
  } catch (error) {
    return next(error);
  }
};

// show one post - not being user
exports.getOnePost = async (req, res, next) => {
  const postId = req.params.postId;
  try {
    const post = await Post.findById(postId);

    if (!post) {
      return next(CustomError.badRequest("No such post found"));
    }

    return res.status(200).json({
      success: true,
      message: `Post fetched successfully`,
      post,
    });
  } catch (error) {
    return next(error);
  }
};

// delete one post
exports.deletePost = async (req, res, next) => {
  const postId = req.params.postId;
  try {
    const post = await Post.findByIdAndDelete(postId);

    if (!post) {
      return next(CustomError.badRequest(`No such post found`));
    }

    return res.status(200).json({
      success: true,
      message: `Post deleted successfully`,
      post,
    });
  } catch (error) {
    return next(error);
  }
};

//disable post - admin
exports.disablePost = async (req, res, next) => {
  const postId = req.params.postId;

  try {
    const post = await Post.findByIdAndUpdate(
      postId,
      { isDisabled: true },
      {
        new: true,
        runValidators: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: `Post is Disabled`,
      post,
    });
  } catch (error) {
    return next(error);
  }
};

// enable post
exports.enablePost = async (req, res, next) => {
  const postId = req.params.postId;

  try {
    const post = await Post.findByIdAndUpdate(
      postId,
      { isDisabled: false },
      {
        new: true,
        runValidators: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: `Post is Enabled`,
      post,
    });
  } catch (error) {
    return next(error);
  }
};

//add Like
//TODO: Check if friend or own post or public
exports.likePost = async (req, res, next) => {
  const postId = req.params.postId;
  const userId = req.user.id;

  try {
    let post = await Post.findById(postId).populate(
      "likes.user",
      "name profilePicUrl"
    );

    if (!post) {
      return next(CustomError.badRequest(`No such post found`));
    }

    //check if post is already liked by user
    const isLiked = post.likes.filter(
      (like) => like.user?._id.toString() == userId.toString()
    ).length;

    //if liked already, then remove like
    if (isLiked) {
      post.likes = post.likes.filter(
        (like) => like.user?._id.toString() !== userId.toString()
      );
    } else {
      //add like
      post.likes.push({
        user: userId,
      });
    }

    //save
    post = await post.save();

    //get all likes again
    post = await Post.findById(postId).populate(
      "likes.user",
      "name profilePicUrl"
    );

    let likes = post.likes.filter((like) => like.user != null);

    return res.status(200).json({
      success: true,
      message: `${isLiked ? "Post Disliked" : "Post Liked"}`,
      likes,
    });
  } catch (error) {
    return next(error);
  }
};

//add Comment
exports.addComment = async (req, res, next) => {
  const userId = req.user.id;
  const postId = req.params.postId;
  const { text } = req.body;

  if (!text) {
    return next(CustomError.badRequest(`Please pass text to add a comment`));
  }

  try {
    let post = await Post.findById(postId);

    if (!post) {
      return next(CustomError.badRequest(`No such post found`));
    }

    //comment
    let comment = {
      _id: mongoose.Types.ObjectId(),
      user: userId,
      text,
      date: new Date(),
    };

    post.comments.push(comment);

    post = await post.save();

    //adding user info to the comment doc
    comment.user = {
      _id: userId,
      name: req.user.name,
      profilePicUrl: req.user.profilePicUrl,
    };

    return res.status(200).json({
      success: true,
      message: "Comment added",
      comment,
    });
  } catch (error) {
    return next(error);
  }
};

//remove Comment //TODO: comment creator or post owner can remove
exports.removeComment = async (req, res, next) => {
  const userId = req.user.id;
  const postId = req.params.postId;
  const commentId = req.params.commentId;

  try {
    let post = await Post.findById(postId);

    if (!post) {
      return next(CustomError.badRequest(`Post does not exist`));
    }

    post.comments = post.comments.filter(
      (comment) => comment._id.toString() !== commentId
    );

    post = await post.save();

    return res.status(200).json({
      success: true,
      message: `Comment removed`,
    });
  } catch (error) {
    return next(error);
  }
};

//update Comment
exports.updateComment = async (req, res, next) => {
  const userId = req.user.id;
  const postId = req.params.postId;
  const commentId = req.params.commentId;

  const { text } = req.body;

  try {
    let post = await Post.findById(postId);

    if (!post) {
      return next(CustomError.badRequest(`Post doesn't exist`));
    }

    post.comments = post.comments.map((comment) => {
      if (comment._id.toString() === commentId) {
        comment.text = text;
      }
      return comment;
    });

    post = await post.save();

    return res.status(200).json({
      success: true,
      message: "Comment updated",
      post,
    });
  } catch (error) {
    return next(error);
  }
};

// All Post -
//for user - Friends and Public posts only
//for admin - all posts
exports.getAllPosts = async (req, res, next) => {
  const userId = req.user.id;
  const role = req.user.role;
  let posts = [];

  try {
    if (role == "user") {
      const { friends } = await Friend.findOne({ user: userId });
      posts = await Post.find({
        $and: [
          {
            $or: [
              {
                user: {
                  $in: [userId, ...friends.map((friend) => friend.user)],
                },
              },
              { visibility: "public" },
            ],
          },
          {
            isDisabled: false,
          },
        ],
      })
        .populate(
          "user likes.user comments.user",
          "name profilePicUrl isDisabled"
        )
        .sort({ createdAt: -1 });
    }

    if (role == "admin") {
      posts = await Post.find({})
        .populate(
          "user likes.user comments.user",
          "name profilePicUrl isDisabled"
        )
        .sort({ createdAt: -1 });
    }

    //filtering all the posts and the likes and comments the belongs to deleted or disabled user
    //filtering posts
    for (let i = 0; i < posts.length; i++) {
      //post
      let post = posts[i];
      if (post.user == null || post.user.isDisabled) {
        posts.splice(i, 1);
        i = i - 1;
        continue;
      } else {
        //likes
        let likes = post.likes;
        for (let i = 0; i < likes.length; i++) {
          let like = likes[i];
          if (like.user == null || like.user.isDisabled) {
            likes.splice(i, 1);
            i = i - 1;
          }
        }

        //comments
        let comments = post.comments;
        for (let i = 0; i < comments.length; i++) {
          let comment = comments[i];
          if (comment.user == null || comment.user.isDisabled) {
            comments.splice(i, 1);
            i = i - 1;
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: posts.length > 0 ? "Posts Found" : "No Posts Found",
      posts,
    });
  } catch (error) {
    return next(error);
  }
};

// trending post
// public,friends, most likes,descending
exports.trendingPost = async (req, res, next) => {
  const userId = req.user.id;
  let posts = [];

  try {
    const { friends } = await Friend.findOne({ user: userId });

    posts = await Post.find({
      $and: [
        {
          $or: [
            {
              user: {
                $in: [userId, ...friends.map((friend) => friend.user)],
              },
            },
            { visibility: "public" },
          ],
        },
        {
          isDisabled: false,
        },
      ],
    }).populate(
      "user likes.user comments.user",
      "name profilePicUrl isDisabled"
    ).lean();

    //filtering all the posts and the likes and comments the belongs to deleted or disabled user
    //filtering posts
    for (let i = 0; i < posts.length; i++) {
      //post
      let post = posts[i];
      if (post.user == null || post.user.isDisabled) {
        posts.splice(i, 1);
        i = i - 1;
        continue;
      } else {
        //likes
        let likes = post.likes;
        for (let i = 0; i < likes.length; i++) {
          let like = likes[i];
          if (like.user == null || like.user.isDisabled) {
            likes.splice(i, 1);
            i = i - 1;
          }
        }

        //comments
        let comments = post.comments;
        for (let i = 0; i < comments.length; i++) {
          let comment = comments[i];
          if (comment.user == null || comment.user.isDisabled) {
            comments.splice(i, 1);
            i = i - 1;
          }
        }
      }
    }


    //sorting by likes
    posts = posts.map(post => {
      post.likesCount = post.likes.length;
      return post;
    })

    posts.sort((a,b)=> (b.likesCount-a.likesCount));


    return res.status(200).json({
      success: true,
      message: "Trending posts found",
      posts,
    });
  } catch (error) {
    return next(error);
  }
};
