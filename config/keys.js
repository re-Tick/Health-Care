// dbPassword = 'mongodb+srv://YOUR_USERNAME_HERE:'+ encodeURIComponent('YOUR_PASSWORD_HERE') + '@CLUSTER_NAME_HERE.mongodb.net/test?retryWrites=true';

dbPassword = 'mongodb+srv://admin-rgs:rgs123@cluster0.jfiow.mongodb.net/HealthCareDB?retryWrites=true&w=majority';
module.exports = {
    mongoURI: dbPassword
};
