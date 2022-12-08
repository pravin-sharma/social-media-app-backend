const { addPost, getAllPosts, getOnePost, deletePost, likePost, addComment, removeComment, updateComment, trendingPost, getAllPostsByUserId } = require('../controllers/post');
const { isAuth } = require('../middleware/isAuth');

const router = require('express').Router();

// add a post
router.post('/post', isAuth, addPost);

// get all posts
router.get('/post/all', isAuth, getAllPosts);

//trending posts
router.get('/post/trending', isAuth, trendingPost);

// get post by post id
router.get('/post/:postId', isAuth, getOnePost);

// get all posts of a user by user id
router.get('/post/all/:userId', isAuth, getAllPostsByUserId)

// delete post by id
router.delete('/post/:postId', isAuth, deletePost);

//add like
router.get('/post/like/:postId', isAuth, likePost);

//add comment
router.post('/post/comment/:postId', isAuth, addComment)

//remove comment
router.delete('/post/comment/:postId/:commentId', isAuth, removeComment)

//update comment
router.put('/post/comment/:postId/:commentId', isAuth, updateComment)

//disable post


module.exports = router;

