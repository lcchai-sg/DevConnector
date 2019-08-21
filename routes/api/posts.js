const express = require('express');
const router = express.Router();
const {
  check,
  validationResult
} = require('express-validator');

const Post = require('../../models/Post');
const Profile = require('../../models/Profile');
const User = require('../../models/User');
const auth = require('../../middleware/auth');

// @route     POST api/posts
// @desc      Create a post
// @access    Private
router.post('/', [auth, [
  check('text', 'Text is required').not().isEmpty()
]], async (req, res) => {
  const errors = validationResult(req);
  console.log('errors: ', errors);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array()
    });
  }

  try {
    const user = await User.findById(req.user.id).select('-password');
    const newPost = new Post({
      text: req.body.text,
      name: user.name,
      avatar: user.avatar,
      user: req.user.id,
    });

    await newPost.save();
    res.status(200).json(newPost);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route     GET api/posts
// @desc      Get all posts
// @access    Private
router.get('/', auth, async (req, res) => {
  try {
    const posts = await Post.find().sort({
      date: -1
    });
    res.status(200).json(posts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route     GET api/posts/:id
// @desc      Get post by id
// @access    Private
router.get('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        msg: 'Post not found'
      });
    }
    res.status(200).json(post);
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({
        msg: 'Post not found'
      });
    }
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route     DELETE api/posts/:id
// @desc      DELETE post by id
// @access    Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        msg: 'Post not found'
      });
    }

    // check if post belongs to user
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({
        msg: 'User not authorized'
      });
    } else {
      await post.remove();
      res.status(200).json({
        msg: 'Post removed'
      });
    }
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({
        msg: 'Post not found'
      });
    }
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route     PUT api/posts/like/:id
// @desc      Like a post
// @access    Private
router.put('/like/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        msg: 'Post not found'
      });
    }
    // check if the post has already been liked
    if (post.likes.filter(like => like.user.toString() === req.user.id).length > 0) {
      return res.status(400).json({
        msg: 'Post already liked'
      });
    }

    post.likes.unshift({
      user: req.user.id
    });

    await post.save();
    res.status(200).json(post.likes);
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({
        msg: 'Post not found'
      });
    }
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route     PUT api/posts/unlike/:id
// @desc      Unlike a post
// @access    Private
router.put('/unlike/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        msg: 'Post not found'
      });
    }

    // get the remove index
    const removeIndex = post.likes.map(like => like.user.toString()).indexOf(req.user.id);

    if (removeIndex >= 0) {
      post.likes.splice(removeIndex, 1);
      await post.save();
    } else {
      return res.status(400).json({
        msg: 'Post has not yet been liked'
      });
    }
    res.status(200).json(post.likes);
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({
        msg: 'Post not found'
      });
    }
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;