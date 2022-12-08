const { default: mongoose } = require("mongoose");
const Friend = require("../models/friend");
const Post = require("../models/post");
const CustomError = require("../utils/CustomError");

// add
exports.addPost = async (req, res, next) => {
  const userId = req.user.id;
  const { mediaUrl, mediaType, caption, visibility } = req.body;

  if (!mediaUrl && !caption) {
    return next(`Please add a media/caption to post`);
  }

  try {
    let post = await Post.create({
      user: userId,
      mediaUrl,
      caption,
      visibility,
      mediaType
    });

    post._doc.user = {
      _id: req.user.id,
      name: req.user.name,
      profilePicUrl: req.user.profilePicUrl
    }

    return res.status(200).json({
      success: true,
      message: `Post Created`,
      post,
    });
  } catch (error) {
    return next(error);
  }
};

// show all posts - by userId
exports.getAllPostsByUserId = async(req,res,next) =>{
  const userId = req.params.userId;

  try {
    const posts = await Post.find({user: userId});

    return res.status(200).json({
      success: true,
      message: posts.length? 'Posts found':'No posts found',
      posts
    })
  } catch (error) {
    return next(error)
  }
}

// show all - all posts
exports.getAllPosts = async (req, res, next) => {
  try {
    const posts = await Post.find({}).populate('user', 'name username profilePicUrl').sort({createdAt: -1});

    return res.status(200).json({
      success: true,
      message: posts.length > 0 ? "Posts Found" : "No Posts Found",
      posts,
    });
  } catch (error) {
    return next(error);
  }
};

// show one
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

// delete one
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

//addLike
//TODO: Check if friend or own post or public
exports.likePost = async (req, res, next) => {
  const postId = req.params.postId;
  const userId = req.user.id;

  try {
    let post = await Post.findById(postId).populate("likes.user");

    if (!post) {
      return next(CustomError.badRequest(`No such post found`));
    }

    //check if post is already liked by user
    const isLiked = post.likes.filter(
      (like) => like.user._id.toString() == userId.toString()
    ).length;

    //if liked already, then remove like
    if (isLiked) {
      post.likes = post.likes.filter(
        (like) => like.user._id.toString() !== userId.toString()
      );
    } else {
      //add like
      post.likes.push({ user: userId });
    }

    //save
    post = await post.save();

    return res.status(200).json({
      success: true,
      message: `${isLiked ? "Post Disliked" : "Post Liked"}`,
      post,
    });
  } catch (error) {
    return next(error);
  }
};

//addComment
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

    post.comments.push({ user: userId, text });

    post = await post.save();

    return res.status(200).json({
      success: true,
      message: "Comment added",
      post,
    });
  } catch (error) {
    return next(error);
  }
};

//removeComment //TODO: comment creator or post owner can remove
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
      post,
    });
  } catch (error) {
    return next(error);
  }
};

//updateComment
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

// trending post
// public,friends, last 7 days, most likes, top 4, descending
exports.trendingPost = async (req, res, next) => {
  const userId = req.user.id;

  try {
    const { friends } = await Friend.findOne({ user: userId });

    const posts = await Post.aggregate([
      {
        $match: {
          user: { $in: [mongoose.Types.ObjectId(userId), ...friends.map((friend) => friend.user)] },
        },
      },
      {
        $project: { 
          user: true,
          caption: true,
          mediaUrl: true,
          visibility: true,
          isDisabled: true,
          likes: true,
          comments: true,
          createdAt: true,
          updatedAt: true,
          likesCount: { $size:"$likes" }
        }
      },
      {
        $sort: {
          likesCount: -1
        }
      },
      {
        $limit: 4
      }
    ]);

    return res.status(200).json({
      success: true,
      message: "Trending posts found",
      posts,
    });
  } catch (error) {
    return next(error);
  }
};

//isFriend
//isPublic
//belongsToMe
