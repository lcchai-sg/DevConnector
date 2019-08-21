const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../../config/config');
const {
  check,
  validationResult
} = require('express-validator');

const auth = require('../../middleware/auth');
const User = require('../../models/User');

// @route     GET api/auth
// @desc      Test route
// @access    Public [no token needed]
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.status(200).json(user);
  } catch (err) {
    console.error(err.message);
    res.status(400).send('Server Error');
  }
});

// @route     POST api/auth
// @desc      Authenticate user & get token
// @access    Public
router.post('/', [
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password is required').exists()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array()
    });
  }

  const {
    email,
    password
  } = req.body;

  try {
    // check if user exists
    let user = await User.findOne({
      email
    });
    if (!user) {
      return res.status(400).json({
        errors: [{
          msg: 'Invalid Credentials'
        }]
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        errors: [{
          msg: 'Invalid Credentials'
        }]
      });
    }

    // return jsonwebtoken
    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      config.JWT_KEY, {
        expiresIn: 360000
      },
      (err, token) => {
        if (err) throw err;
        res.status(201).json({
          msg: "Login Successful",
          token
        });
      });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;