const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');

// Load User model
const PUser = require('../models/Patient');
const DUser = require('../models/Doctor');

function SessionConstructor(userId, userGroup, details) {
  this.userId = userId;
  this.userGroup = userGroup;
  this.details = details;
}


module.exports = function (passport) {

  passport.serializeUser(function (userObject, done) {

    let userGroup = 'model1';
    let userPrototype = Object.getPrototypeOf(userObject);

    if (userPrototype === PUser.prototype) {
      userGroup = "model1";
    } else if (userPrototype === DUser.prototype) {
      userGroup = "model2";
    }

    let sessionConstructor = new SessionConstructor(userObject.id, userGroup, '');

    //console.log(sessionConstructor);
    done(null, sessionConstructor);
  });

  passport.deserializeUser(function (sessionConstructor, done) {
    if (sessionConstructor.userGroup == 'model1') {
      PUser.findOne({
        _id: sessionConstructor.userId
      }, '-localStrategy.password', function (err, user) { // When using string syntax, prefixing a path with - will flag that path as excluded.
        done(err, user);
      });
    } else if (sessionConstructor.userGroup == 'model2') {
      DUser.findOne({
        _id: sessionConstructor.userId
      }, '-localStrategy.password', function (err, user) { // When using string syntax, prefixing a path with - will flag that path as excluded.
        done(err, user);
      });
    }
  });

  //------------patients---------------------
  passport.use('local-P',
    new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
      // Match user
      PUser.findOne({
        email: email
      }).then(user => {
        if (!user) {
          return done(null, false, { message: 'That email is not registered' });
        }

        // Match password
        bcrypt.compare(password, user.password, (err, isMatch) => {
          if (err) throw err;
          if (isMatch) {
            return done(null, user);
          } else {
            return done(null, false, { message: 'Password incorrect' });
          }
        });
      });
    })
  );

  //-------------doc--------------
  passport.use('local-D',
    new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
      // Match user
      DUser.findOne({
        email: email
      }).then(user => {
        if (!user) {
          return done(null, false, { message: 'That email is not registered' });
        }


        // Match password
        bcrypt.compare(password, user.password, (err, isMatch) => {
          if (err) throw err;
          if (isMatch) {
            return done(null, user);
          } else {
            return done(null, false, { message: 'Password incorrect' });
          }
        });

      });
    })
  );




};

