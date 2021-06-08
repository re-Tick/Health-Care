const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    patientId: String,
    patientName: String,
    patientPhoto: {
        data: Buffer,
        contentType: String
    },
    doctorId: String,
    doctorName: String,
    doctorSpeciality: String,
    clinicAddress: String,
    doctorPhoto: {
        data: Buffer,
        contentType: String
    },
    prescription: {
        type: {
            Pdate: {
                type: Date,
            },
            photo: {
                data: Buffer,
                contentType: String,
            },
        },
        default: null
    },

    pFlag: Number,
    dFlag: Number,
    date: Date,
    datE: String,
    bookedAt: Date,
    time: {
        start: Date,
        end: Date,
        Start: String,
        End: String
    },
    description: String
});

const Appointment = mongoose.model('appointment', appointmentSchema);

module.exports = Appointment;