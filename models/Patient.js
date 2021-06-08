const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  dateOfBirth: Date,
  address: String,
  emergencyContacts: {
    name: String,
    phone: String,
    address: String
  },
  photo: {
    data: Buffer,
    contentType: String
  },
  sex: String,
  phone: String,
  illness: String,
  prescriptions: [{
      date: Date,
      doctorName: String,
      text: String
  }]
});

const Patient = mongoose.model('Patient', UserSchema);

module.exports = Patient;
