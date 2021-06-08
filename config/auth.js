
const PUser = require('../models/Patient');
const DUser = require('../models/Doctor');


module.exports = {
  ensureAuthenticated: function (req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    req.flash('error_msg', 'Please log in to view that resource');
    res.redirect('/');
  },
  forwardAuthenticated: function (req, res, next) {
    if (!req.isAuthenticated()) {
      return next();
    } else {

      //we did this because when we were logged in patient account, and also we were getting access of patient acc through doctor acc also.
      if (Object.getPrototypeOf(req.user) === PUser.prototype) {
        if (req.url[1] === 'P') {
          res.redirect('/Pdashboard')
        } else {
          return next();
        }

      }
      else {
        if (req.url[1] === 'D') {
          res.redirect('/Ddashboard')
        } else {
          return next();
        }

      }
    }
  }
};
