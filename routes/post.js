const { addPost, getAllPosts, getOnePost, deletePost, likePost, addComment, removeComment, updateComment } = require('../controllers/post');
const { isAuth } = require('../middleware/isAuth');

const router = require('express').Router();

router.post('/post', isAuth, addPost);
router.get('/post/all', isAuth, getAllPosts);
router.get('/post/:postId', isAuth, getOnePost);
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
//view all posts

module.exports = router;

