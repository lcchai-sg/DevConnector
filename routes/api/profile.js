const express = require('express');
const router = express.Router();
const request = require('request');
const config = require('../../config/config');
const auth = require('../../middleware/auth');
const {
  check,
  validationResult
} = require('express-validator');

const Profile = require('../../models/Profile');
const User = require('../../models/User');

// @route     GET api/profile/me
// @desc      Get current user profile
// @access    Private
router.get('/me', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id
    }).populate('user', ['name', 'avatar']);

    if (!profile) {
      return res.status(400).json({
        msg: 'User profile not found!'
      });
    }
    res.status(200).json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route     GET api/profile/user/:user_id
// @desc      Get profile by user ID
// @access    Public
router.get('/user/:id', async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.id
    }).populate('user', ['name', 'avatar']);

    if (!profile) {
      return res.status(400).json({
        msg: 'User profile not found!'
      });
    }
    res.status(200).json(profile);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(400).json({
        msg: 'User profile not found!'
      });
    }
    res.status(500).send('Server Error');
  }
});

// @route     GET api/profile
// @desc      Get all profiles
// @access    Public
router.get('/', async (req, res) => {
  try {
    const profiles = await Profile.find().populate('user', ['name', 'avatar']);
    res.status(200).json(profiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route     POST api/profile/me
// @desc      Create or update user profile
// @access    Private
router.post('/', [auth, [
  check('status', 'Status is required').not().isEmpty(),
  check('skills', 'Skills are required').not().isEmpty()
]], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array()
    });
  }

  const {
    company,
    website,
    location,
    bio,
    status,
    githubusername,
    skills,
    youtube,
    facebook,
    twitter,
    instagram,
    linkedin
  } = req.body;

  // build profile object
  const profileFields = {};
  profileFields.user = req.user.id;
  if (company) profileFields.company = company;
  if (website) profileFields.website = website;
  if (location) profileFields.location = location;
  if (bio) profileFields.bio = bio;
  if (status) profileFields.status = status;
  if (githubusername) profileFields.githubusername = githubusername;
  if (skills) {
    profileFields.skills = skills.split(',').map(skill => skill.trim());
  }

  // build social object
  profileFields.social = {};
  if (youtube) profileFields.social.youtube = youtube;
  if (twitter) profileFields.social.twitter = twitter;
  if (facebook) profileFields.social.facebook = facebook;
  if (linkedin) profileFields.social.linkedin = linkedin;
  if (instagram) profileFields.social.instagram = instagram;

  try {
    let profile = await Profile.findOne({
      user: req.user.id
    });
    if (profile) {
      // update profile
      profile = await Profile.findOneAndUpdate({
        user: req.user.id
      }, {
        $set: profileFields
      }, {
        new: true
      });
      return res.status(200).json(profile);
    }

    // create new profile
    profile = new Profile(profileFields);
    await profile.save();
    res.status(200).json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route     DELETE api/profile/
// @desc      Delete profile, user & posts
// @access    Private
router.delete('/', auth, async (req, res) => {
  try {
    // @todo - remove users posts
    // remove profile
    await Profile.findOneAndRemove({
      user: req.user.id
    });
    // remove user
    await User.findOneAndRemove({
      _id: req.user.id
    });
    res.status(200).json({
      msg: 'User deleted'
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route     PUT api/profile/experience
// @desc      Add profile experience
// @access    Private
router.put('/experience', [auth, [
  check('title', 'Title is required').not().isEmpty(),
  check('company', 'Company is required').not().isEmpty(),
  check('from', 'From date is required').not().isEmpty()
]], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array()
    });
  }

  const {
    company,
    title,
    location,
    from,
    to,
    current,
    description
  } = req.body;

  // build profile object
  const newExp = {
    company,
    title,
    location,
    from,
    to,
    current,
    description
  };

  try {
    let profile = await Profile.findOne({
      user: req.user.id
    });
    profile.experience.unshift(newExp);
    // create new profile
    await profile.save();
    res.status(200).json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route     DELETE api/profile/experience/:exp_id
// @desc      Delete experience from profile
// @access    Private
router.delete('/experience/:exp_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id
    });

    // get remove index
    const removeIndex = profile.experience
      .map(item => item.id)
      .indexOf(req.params.exp_id);

    if (removeIndex >= 0) {
      profile.experience.splice(removeIndex, 1);
      // remove user
      await profile.save();
    }
    res.status(200).json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route     PUT api/profile/education
// @desc      Add profile education
// @access    Private
router.put('/education', [auth, [
  check('school', 'School is required').not().isEmpty(),
  check('degree', 'Degree is required').not().isEmpty(),
  check('fieldofstudy', 'Field of study is required').not().isEmpty(),
  check('from', 'From date is required').not().isEmpty()
]], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array()
    });
  }

  const {
    school,
    degree,
    fieldofstudy,
    from,
    to,
    current,
    description
  } = req.body;

  // build profile object
  const newEdu = {
    school,
    degree,
    fieldofstudy,
    from,
    to,
    current,
    description
  };

  try {
    let profile = await Profile.findOne({
      user: req.user.id
    });
    profile.education.unshift(newEdu);
    // create new profile
    await profile.save();
    res.status(200).json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route     DELETE api/profile/education/:exp_id
// @desc      Delete education from profile
// @access    Private
router.delete('/education/:edu_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id
    });

    // get remove index
    const removeIndex = profile.education
      .map(item => item.id)
      .indexOf(req.params.edu_id);

    if (removeIndex >= 0) {
      profile.education.splice(removeIndex, 1);
      // remove user
      await profile.save();
    }
    res.status(200).json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route     GET api/profile/github/:username
// @desc      GET user repos from Github
// @access    Public
router.get('/github/:username', async (req, res) => {
  try {
    const options = {
      uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc&client_id=${config.githubid}&client_secret=${config.githubsecret}`,
      method: 'GET',
      headers: {
        'user-agent': 'node.js'
      },
    };

    request(options, (error, response, body) => {
      if (error) console.error(error);

      if (response.statusCode !== 200) {
        return res.status(404).json({
          msg: 'No github profile found'
        });
      }
      res.status(200).json(JSON.parse(body));
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;