const express = require('express');
const router = express.Router();
const { ensureAuthenticated, forwardAuthenticated } = require('../config/auth');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const moment = require('moment');
const fast2sms = require('fast-two-sms');
//Change get to delete request
router.use(function (req, res, next) {
  // this middleware will call for each requested
  // and we checked for the requested query properties
  // if _method was existed
  // then we know, clients need to call DELETE request instead
  if (req.query._method == 'DELETE') {
    // change the original METHOD
    // into DELETE method
    req.method = 'DELETE';
    // and set requested url to /user/12
    req.url = req.path;
  }
  next();
});


//multer
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './routes/uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const maxSize = 400 * 1024; //400kb
var upload = multer({
  storage: storage,
  limits: { fileSize: maxSize },
  fileFilter: (req, file, cb) => {
    if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg") {
      cb(null, true);
    } else {
      cb(null, false);
      return cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
    }
  }
})

//--- Models of db
const PUser = require('../models/Patient');
const DUser = require('../models/Doctor');
const { mainModule } = require('process');
const appoint = require('../models/Appointment');
const Quote = require('../models/quotes');
const { route } = require('./users');


//Homepage
router.get('/', (req, res) => (
  res.render("homepage")
))

router.get('/About-us', (req, res) => (
  res.render("AboutUs")
))

router.get('/Contact-us', (req, res) => (
  res.render("ContactUs")
))


// Register/Login Page
router.get('/welcome', forwardAuthenticated, (req, res) => res.render('welcome'));
router.get('/users/Patient', (req, res) => res.render('Patient'));
router.get('/users/Doctor', (req, res) => res.render('Doctor'));

//Dashboard 

//doc
router.get('/Ddashboard', ensureAuthenticated, (req, res) => {
  if (Object.getPrototypeOf(req.user) === PUser.prototype) {
    res.redirect("/");
  }
  else {
    let curr = new Date();
    let c = curr.getDate() % 7;
    Quote.find({}, function (err, data) {
      res.render('Ddashboard', { user: req.user, quote: data[c] });
    })
  }
});

//patient
router.get('/Pdashboard', ensureAuthenticated, (req, res) => {
  if (Object.getPrototypeOf(req.user) === DUser.prototype) {
    res.redirect("/");
  }
  else {
    let curr = new Date();
    let c = curr.getDate() % 7;
    Quote.find({}, function (err, data) {
      res.render('Pdashboard', { user: req.user, quote: data[c] });
    })

  }
});



//---------Edit profile---------


//---------doctor-----------

router.get('/Ddashboard/DeditProfile', ensureAuthenticated, (req, res) => {
  var yourDate = req.user.dateOfBirth;
  var daTe = yourDate.toISOString().split('T')[0]

  let shr = req.user.clinicTiming.start.getHours();
  let smin = req.user.clinicTiming.start.getMinutes();
  let ehr = req.user.clinicTiming.end.getHours();
  let emin = req.user.clinicTiming.end.getMinutes();

  let stime = "";
  let etime = "";

  if (shr < 10) {
    stime += "0" + shr;
  } else {
    stime += shr;
  }
  stime += ":";
  if (smin < 10) {
    stime += "0" + smin;
  } else {
    stime += smin;
  }

  if (ehr < 10) {
    etime += "0" + ehr;
  } else {
    etime += ehr;
  }
  etime += ":";
  if (emin < 10) {
    etime += "0" + emin;
  } else {
    etime += emin;
  }

  //console.log(stime + " " + etime);
  res.render('DeditProfile', { user: req.user, date: daTe, start: stime, end: etime });
});

router.post('/Ddashboard/DeditProfile', (req, res) => {

  upload.single('photo')(req, res, function (err) {
    if (err) {
      req.flash('error_msg', 'File Size Exceeded');
      res.render("partials/FileLimitExceeded");
    } else {

      const { name, address, dateOfBirth, medicalSchool, yearsOfPractice, language, clinicAddress, startTime, endTime, speciality, phone, sex, email, password, password2, consultancyFees } = req.body;
      let errors = [];

      if (!name || !password || !password2 || !address || !language || !dateOfBirth || !speciality || !clinicAddress || !medicalSchool || !yearsOfPractice || !phone || !sex || !consultancyFees) {
        errors.push({ msg: 'Please enter all fields' });
      }

      if (password != password2) {
        errors.push({ msg: 'Passwords do not match' });
      }

      if (password.length < 6) {
        errors.push({ msg: 'Password must be at least 6 characters' });
      }

      if (errors.length > 0) {
        res.redirect("/Ddashboard/DeditProfile");
      } else {

        //console.log(req.body);


        //clinic timings
        //start
        const shours = startTime.slice(0, 2);
        const sminutes = startTime.slice(3);
        const stime = new Date();
        stime.setHours(shours, sminutes);
        //end
        const ehours = endTime.slice(0, 2);
        const eminutes = endTime.slice(3);
        const etime = new Date();
        etime.setHours(ehours, eminutes);


        DUser.findOne({ _id: req.body.userId }, function (err, foundUser) {
          if (err) {
            console.log(err);
          } else {
            if (!foundUser) {
            } else {
              let options1 = {
                hour: '2-digit',
                minute: '2-digit'
              };
              //console.log(stime + " " + etime);
              foundUser.name = name;
              foundUser.address = address;
              foundUser.dateOfBirth = new Date(dateOfBirth);
              foundUser.medicalSchool = medicalSchool;
              foundUser.yearsOfPractice = yearsOfPractice;
              foundUser.language = language;
              foundUser.clinicAddress = clinicAddress;
              foundUser.clinicTiming = {
                start: stime,
                end: etime,
                Start: stime.toLocaleString('en-us', options1),
                End: etime.toLocaleString('en-us', options1)
              };
              foundUser.speciality = speciality;
              foundUser.phone = phone;
              foundUser.sex = sex;
              foundUser.consultancyFees = consultancyFees;



              //checking because we cant set value of any file because its against security measures
              if (req.body.Dcheckbox !== undefined) {
                if (req.file !== undefined) {
                  foundUser.photo = {
                    data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)),
                    contentType: req.file.mimetype
                  }
                } else {
                  return res.redirect("/Ddashboard/DeditProfile")
                }
              }


              bcrypt.genSalt(10, (err, salt) => {
                bcrypt.hash(password, salt, (err, hash) => {
                  if (err) throw err;

                  if (foundUser.password !== password) {
                    foundUser.password = hash;
                  }

                  foundUser.save()
                    .then(user => {
                      req.flash(
                        'success_msg',
                        'You have updated your profile'
                      );
                      //console.log(foundUser);
                      res.redirect('/Ddashboard');
                    })
                    .catch(err => console.log(err));
                });
              });


            }
          }
        });
      }
    }
  });
});


//----------------patient--------------------


router.get('/Pdashboard/PeditProfile', ensureAuthenticated, (req, res) => {
  var yourDate = new Date();
  var daTe = yourDate.toISOString().split('T')[0]
  res.render('PeditProfile', { user: req.user, date: daTe });
});


router.post('/Pdashboard/PeditProfile', (req, res) => {

  upload.single('photo')(req, res, function (err) {
    if (err) {
      req.flash('error_msg', 'File Size Exceeded');
      res.render("partials/FileLimitExceeded");
    } else {

      const { name, address, dateOfBirth, password, sex, email, phone, password2, emergencyName, emergencyPhone, emergencyAddress } = req.body;
      let errors = [];


      if (!name || !password || !password2 || !address || !dateOfBirth || !sex || !phone || !emergencyName || !emergencyPhone || !emergencyAddress) {
        errors.push({ msg: 'Please enter all fields' });
      }

      if (password != password2) {
        errors.push({ msg: 'Passwords do not match' });
      }

      if (password.length < 6) {
        errors.push({ msg: 'Password must be at least 6 characters' });
      }

      if (errors.length > 0) {
        res.redirect("/Pdashboard/PeditProfile");
      } else {

        PUser.findOne({ _id: req.body.userId }, function (err, foundUser) {
          if (err) {
            console.log(err);
          } else {
            if (!foundUser) {
            } else {

              foundUser.name = name;
              foundUser.address = address;
              foundUser.dateOfBirth = new Date(dateOfBirth);
              foundUser.phone = phone;
              foundUser.sex = sex;

              if (req.body.Pcheckbox !== undefined) {
                if (req.file !== undefined) {
                  foundUser.photo = {
                    data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)),
                    contentType: req.file.mimetype
                  }
                } else {
                  return res.redirect("/Pdashboard/PeditProfile")
                }
              }

              foundUser.emergencyContacts = {
                name: emergencyName,
                phone: emergencyPhone,
                address: emergencyAddress
              }

              //console.log("abhi tak to bhar hi hu");





              bcrypt.genSalt(10, (err, salt) => {
                bcrypt.hash(password, salt, (err, hash) => {
                  if (err) throw err;

                  if (foundUser.password !== password) {
                    foundUser.password = hash;
                  }

                  foundUser.save()
                    .then(user => {
                      req.flash(
                        'success_msg',
                        'You have updated your profile'
                      );
                      //console.log(foundUser);
                      res.redirect('/Pdashboard');
                    })
                    .catch(err => console.log(err));

                });
              });


            }
          }
        });
      }
    }
  });
});

//Search for doctors post route

router.post('/Pdashboard', function (req, res) {
  if (req.isAuthenticated()) {
    //console.log(req.body);
    let x = req.body.search;
    if (req.body.category === 'speciality') {
      DUser.find({ speciality: _.lowerCase(x) }, null, { sort: { rating: -1 } }, function (err, data) {
        if (err) {
          console.log(err);
        }
        else {
          //console.log(data);
          res.render('searchForDoctors', { data: data });
        }
      });
    }
    else {
      DUser.find({ name: _.lowerCase(x) }, null, { sort: { rating: -1 } }, function (err, data) {
        if (err) {
          console.log(err);
        }
        else {
          //console.log(data);
          res.render('searchForDoctors', { data: data });
        }
      });
    }
  }
  else {
    res.redirect('/');
  }
})

// Appoitment page
router.get("/Pdashboard/makeAnAppoitment/:did", ensureAuthenticated, function (req, res) {
  DUser.find({ _id: req.params.did }, function (err, data) {
    let date = new Date();
    let today = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + (date.getDate());
    date = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
    let tom = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + (date.getDate());
    date = new Date(new Date().getTime() + 48 * 60 * 60 * 1000);
    let tom1 = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + (date.getDate());
    date = new Date(new Date().getTime() + 72 * 60 * 60 * 1000);
    let tom2 = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + (date.getDate());
    date = new Date(new Date().getTime() + 96 * 60 * 60 * 1000);
    let tom3 = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + (date.getDate());
    date = new Date(new Date().getTime() + 120 * 60 * 60 * 1000);
    let tom4 = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + (date.getDate());
    date = new Date(new Date().getTime() + 144 * 60 * 60 * 1000);
    let tom5 = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + (date.getDate());
    res.render("MakeAppoitment", { doctor: data, patient: req.user, today: today, tom: tom, tom1: tom1, tom2: tom2, tom3: tom3, tom4: tom4, tom5: tom5 });
  });
  //res.send(req.params.did);
});

router.post("/Pdashboard/makeAnAppoitment/:did", function (req, res) {
  //console.log(req.user._id);

  var t;
  DUser.find({ _id: req.body.doctorId }, function (err, data) {
    if (err) console.log(err);
    else {
      t = data[0].clinicTiming;
      //console.log(req.body.day);
      appoint.find({ doctorId: req.params.did, date: new Date(req.body.day) }, function (err, arr) {
        if (err)
          console.log(err);
        else {
          if (arr.length >= 3) {
            req.flash('error_msg', 'Slots full on ' + req.body.day);
            res.redirect("/Pdashboard/makeAnAppoitment/" + req.params.did);
          }
          else {
            let now = new Date(req.body.day);

            let options = {
              weekday: 'long',
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            };

            now.toLocaleString('en-us', options);

            let options1 = {
              hour: '2-digit',
              minute: '2-digit'
            };
            let x = {
              start: t.start,
              end: t.end,
              Start: t.start.toLocaleString('en-us', options1),
              End: t.end.toLocaleString('en-us', options1)
            };
            //console.log(arr.length);
            //console.log(x);
            const appointment = new appoint({
              patientId: req.user._id,
              patientName: req.user.name,
              patientPhoto: req.user.photo,
              doctorId: req.params.did,
              doctorName: data[0].name,
              doctorSpeciality: data[0].speciality,
              clinicAddress: data[0].clinicAddress,
              doctorPhoto: data[0].photo,
              date: new Date(req.body.day),
              datE: now.toLocaleString('en-us', options),
              bookedAt: new Date(),
              time: x
            });
            //console.log(t);
            // let a = data[0].name;
            // let t1 = req.body.time;
            // let d = req.body.day;
            // let message1 = `Your appointment has been successfully booked with docId ${a} at timings ${t1} on ${d} `;
            // console.log(message1);
            // fast2sms.sendMessage({ authorization: process.env.API_KEY, message: message1, numbers: 9958178959 });
            // res.send(response);

            appointment.save().then(() => {
              res.redirect("/Pdashboard/PmyAppointments");
            });

          }
        }
      })

    }
  })

});

// Route for showing "My appointments" for patient
router.get("/Pdashboard/PmyAppointments", ensureAuthenticated, function (req, res) {

  appoint.find({ patientId: req.user._id }, null, { sort: { date: 1, bookedAt: 1 } }, function (err, data) {
    if (err)
      console.log(err);
    else {
      res.render("PMy-Appointments", { data: data });
    }
  })
});

//Route for showing "My Appointments" for doctor
router.get("/Ddashboard/DmyAppointments", ensureAuthenticated, function (req, res) {
  appoint.find({ doctorId: req.user._id }, null, { sort: { date: 1, bookedAt: 1 } }, function (err, data) {
    if (err)
      console.log(err);
    else {
      res.render("DMy-Appointments", { data: data, currD: new Date() });
    }
  })
});

//Cancel Appointment for patient
router.delete("/Pdelete/:id", function (req, res) {
  appoint.deleteOne({ _id: req.params.id }, function (err, r) {
    if (err)
      console.log(err);
    else
      res.redirect("/Pdashboard/PmyAppointments");
  })
})

//Cancel Appointment for doctor
router.delete("/Ddelete/:id", function (req, res) {
  appoint.deleteOne({ _id: req.params.id }, function (err, r) {
    if (err)
      console.log(err);
    else
      res.redirect("/Ddashboard/DmyAppointments");
  })
})

//for Prescriptions
router.get("/Ddashboard/DmyAppointments/Prescription/:appid", ensureAuthenticated, function (req, res) {
  res.render("Prescription", { appid: req.params.appid });
  // appoint.find({ patientId: req.params.appid }, null, function (err, data) {
  //   if (err)
  //     console.log(err);
  //   else {
  //     res.render("Prescription", { data: data });
  //   }
  // })
})

router.post("/Ddashboard/DmyAppointments/Prescription/:apid", function (req, res) {
  upload.single('photo')(req, res, function (err) {
    if (err) {
      req.flash('error_msg', 'File Size Exceeded');
      res.render("partials/FileLimitExceeded");
    } else {

      let appid = req.params.apid;

      // console.log(appid);

      appoint.findByIdAndUpdate({ _id: appid }, {
        prescription: {
          photo: {
            data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)),
            contentType: req.file.mimetype
          },
          Pdate: new Date().toLocaleDateString()
        }, dFlag: 1
      }, function (err, foundUser) {
        if (err) {
          console.log(err);
        } else {
          if (foundUser) {
            //console.log("ha user hai yaha");
          }
          res.redirect("/Ddashboard/DmyAppointments")
        }
      });
    }
  });
});


router.get("/Pdashboard/viewprofile/:did", ensureAuthenticated, function (req, res) {
  DUser.find({ _id: req.params.did }, function (err, data) {
    res.render("Viewprofile.ejs", { doctor: data, patient: req.user });
  });
  //res.send(req.params.did);
});

//Patient records for past appointments
router.get("/myRecordsP", ensureAuthenticated, function (req, res) {
  appoint.find({ patientId: req.user._id }, null, { sort: { date: 1, bookedAt: 1 } }, function (err, data) {
    if (err) {
      console.log(err);
    }
    else {
      res.render("MyRecordsP", { data: data });
    }
  })
})

//Doctor records for past appointments
router.get("/myRecords", ensureAuthenticated, function (req, res) {
  appoint.find({ doctorId: req.user._id }, null, { sort: { date: 1, bookedAt: 1 } }, function (err, data) {
    if (err)
      console.log(err);
    else {
      res.render("MyRecords", { data: data });
    }
  })
});

//rate Doctor Rout
router.get("/Pdashboard/rateDoctor/:did/:appid", ensureAuthenticated, function (req, res) {
  DUser.find({ _id: req.params.did }, function (err, data) {
    //console.log(data);
    res.render("Rate", { doctor: data[0], patient: req.user, appid: req.params.appid });
  });
});
router.post("/Pdashboard/rateDoctor/:did/:appid", ensureAuthenticated, function (req, res) {
  DUser.findById({ _id: req.params.did }, function (err, data) {
    if (err)
      console.log(err);
    else {
      // console.log(parseInt(req.body.rating));

      DUser.findByIdAndUpdate({ _id: req.params.did }, {
        rating: (data.sumOfRate + parseInt(req.body.rating)) / (data.numberOfAppoints + 1),
        sumOfRate: data.sumOfRate + parseInt(req.body.rating),
        numberOfAppoints: data.numberOfAppoints + 1
      }, function (err, f) {
        if (err)
          console.log(err);
        else {
          //console.log(f);
          appoint.findByIdAndUpdate({ _id: req.params.appid }, {
            pFlag: 1
          }, function (err, foundUser) {
            if (err) {
              console.log(err);
            } else {
              if (foundUser) {
                //console.log("ha user hai yaha");
              }
              res.redirect("/myRecordsP");
            }
          });
        }
      })
    }
  })
})

module.exports = router;
