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
  address: String,
  dateOfBirth: Date,
  medicalSchool: String,
  yearsOfPractice: String,
  language:String,
  clinicAddress: String,
  rating: Number,
  numberOfAppoints: Number,
  sumOfRate: Number,
  clinicTiming:{
    start:{
      type:Date
    },
    end:{
      type:Date
    },
    Start: String,
    End: String
  },
  photo: {
    data: Buffer,
    contentType: String
  },
  sex: String,
  phone: String,
  speciality: String,
  patients: [{
      id: String
  }],
  consultancyFees:Number,
  acheivements: []
});

const Doctor = mongoose.model('Doctor', UserSchema);

module.exports = Doctor;
