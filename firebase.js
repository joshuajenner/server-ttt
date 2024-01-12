const admin = require('firebase-admin');
const serviceAccount = require('./google');

admin.initializeApp({  credential: admin.credential.cert(serviceAccount.seviceJson)});
const db = admin.firestore();

module.exports = {db};