const express = require('express');
const { body, validationResult } = require('express-validator');
const LendPerson = require('../models/LendPerson');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/lend-people
// @desc    Get all saved people for lending
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const people = await LendPerson.find({ user: req.user._id })
      .sort({ name: 1 })
      .select('name');

    res.json({
      people: people.map(p => p.name)
    });

  } catch (error) {
    console.error('Get lend people error:', error);
    res.status(500).json({ message: 'Server error while fetching people' });
  }
});

// @route   POST /api/lend-people
// @desc    Add a new person for lending
// @access  Private
router.post('/', [
  auth,
  body('name').isString().trim().notEmpty().withMessage('Person name is required')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name } = req.body;

    // Check if person already exists for this user
    const existingPerson = await LendPerson.findOne({
      user: req.user._id,
      name: name.trim()
    });

    if (existingPerson) {
      return res.status(400).json({ message: 'This person already exists in your list' });
    }

    // Create new person
    const person = new LendPerson({
      user: req.user._id,
      name: name.trim()
    });

    await person.save();

    res.status(201).json({
      message: 'Person added successfully',
      name: person.name
    });

  } catch (error) {
    console.error('Add lend person error:', error);
    res.status(500).json({ message: 'Server error while adding person' });
  }
});

// @route   DELETE /api/lend-people/:name
// @desc    Delete a person from lending list
// @access  Private
router.delete('/:name', auth, async (req, res) => {
  try {
    const person = await LendPerson.findOneAndDelete({
      user: req.user._id,
      name: req.params.name
    });

    if (!person) {
      return res.status(404).json({ message: 'Person not found' });
    }

    res.json({ message: 'Person deleted successfully' });

  } catch (error) {
    console.error('Delete lend person error:', error);
    res.status(500).json({ message: 'Server error while deleting person' });
  }
});

module.exports = router;
