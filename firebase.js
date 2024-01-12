const admin = require('firebase-admin');
const serviceFile = require('./google');

admin.initializeApp({  credential: admin.credential.cert(serviceFile.serviceAccount)});
const db = admin.firestore();

module.exports = {db};