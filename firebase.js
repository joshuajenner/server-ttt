const admin = require('firebase-admin');
const serviceAccount = require('./tictactoe-g2-8-fc37382609ff.json');

admin.initializeApp({  credential: admin.credential.cert(serviceAccount)});
const db = admin.firestore();

module.exports = {db};