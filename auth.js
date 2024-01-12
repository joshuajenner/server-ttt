const admin = require('firebase-admin');
const serviceFile = require("./google");


admin.initializeApp({ credential: admin.credential.cert(serviceFile.serviceAccount)});
const db = admin.firestore();


async function login(givenUser, givenPass) {
    const snapshot = await db.collection('users').where('username', '==', givenUser).get();
    if (snapshot.empty) {
        return false;
    } else {
        snapshot.forEach(doc => {
            if (doc.data().password == givenPass) {
                return true;
            } else {
                return false;
            }
        });
    }
};

async function signup(givenUser, givenPass) {
    const snapshot = await db.collection('users').where('username', '==', givenUser).get();
    if (snapshot.empty) {
        db.collection('users').add({ username: givenUser, password: givenPass });
        return true;
    } else {
        return false;
    }
};


module.exports = { login, signup }