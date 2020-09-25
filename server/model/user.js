const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { model } = require('mongoose')
require('dotenv').config()

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: [true, 'Username is required'],
    trim: true,
  },
  email: {
    type: String,
    unique: true,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    validate(value) {
      if (!validator.isEmail(value)) {
        throw new Error('Email is invalid')
      }
    },
  },
  age: {
    type: Number,
    default: 0,
    // required: [true, 'Birthday is required'],
    // validate(value) {
    //   if (value <= 15) {
    //     throw new Error('Age must be equal or greather than 15')
    //   }
    // },
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    trim: true,
    minlength: 7,
  },
  country: {
    type: String,
    required: [true, 'Country is required'],
  },
  // ! To switch from age to birthday only
  birthday: {
    type: String,
    // required: true,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
})

// Generating token after registering OR login
userSchema.methods.generateAuthToken = function () {
  const user = this
  const token = jwt.sign({ _id: user._id.toString() }, 'jwt_secret')

  return token
}

// todo add to async functions try and catch blocks
userSchema.statics.findByCredentials = async (givenEmail, givenPassword) => {
  const errorMessage =
    "The email address or password that you've entered doesn't match any account."

  const user = await User.findOne({ email: givenEmail })

  if (!user) {
    throw new Error(errorMessage)
  }

  const isMatch = await bcrypt.compare(givenPassword, user.password)

  if (!isMatch) {
    throw new Error(errorMessage)
  }

  return user
}

userSchema.statics.checkDuplicateEmail = async (givenEmail) => {
  const user = await User.findOne({ email: givenEmail })

  if (user) {
    throw new Error('Duplicate email')
  }

  return user
}

// * Middlewear to hash password before saving or updating
// Use es5 function since we need (this).
userSchema.pre('save', async function (next) {
  const user = this

  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8)
  }

  next()
})

// * Schema is the blueprint & model make it possible to use it in our code
// Since whenever we want to use db we access through the model
const User = mongoose.model('User', userSchema)

module.exports = User