const router = require('express').Router();
const Database = require('../database/database');
const bcrypt = require('bcrypt');
// const cookieParser = require('cookie-parser');

function validUser(user) {
  //check if user and password
  const validUser = typeof user.email === 'string' && user.email.trim() != '';
  const validPassword =
    typeof user.password === 'string' &&
    user.password.trim() != '' &&
    user.password.trim().length >= 6;

  return validUser && validPassword;
}

//route paths are prepended with /auth

const signUp = (req, res, next) => {
  if (validUser(req.body)) {
    Database.getOneByEmail(req.body.email).then(user => {
      console.log('user', user);
      // if user not found
      if (!user) {
        // then this is a unique email
        // hash password - bcrypt.hash(myPlaintextPassword, saltRounds)
        bcrypt.hash(req.body.password, 10).then(hash => {
          // insert user in db
          const user = {
            email: req.body.email,
            password: hash,
            created_at: new Date()
          };
          Database.create(user).then(id => {
            // return id as json
            res.json({
              id,
              message: 'signup'
            });
          });
          // redirect
        });
      } else {
        //email in use
        next(new Error('Email in use'));
      }
    });
  } else {
    //send error
    next(new Error('Invalid user'));
  }
};

const signIn = (req, res, next) => {
  if (validUser(req.body)) {
    // check to see if in DB
    Database.getOneByEmail(req.body.email).then(user => {
      console.log('user', user);
      if (user) {
        // compare entered password with hashed password in db
        bcrypt.compare(req.body.password, user.password).then(result => {
          // if the passwords matched
          if (result) {
            // set the 'set-cookie' header
            const isSecure = req.app.get('env') !== 'development';
            res.cookie('user_id', user.id, {
              httpOnly: true,
              secure: isSecure, //secure when in production
              signed: true
            });
            //login in
            res.json({
              result,
              message: 'Logging in'
            });
          } else {
            next(new Error('Invalid login'));
          }
        });
      } else {
        next(new Error('Invalid login'));
      }
    });
  } else {
    next(new Error('invalid user'));
  }
};

module.exports = {
  signIn,
  signUp
};
