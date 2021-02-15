const admin = require('firebase-admin');
const serviceAccount = require('/tictactoe-g2-8-fc37382609ff.json');


admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();


async function login(givenUser, givenPass) {
    const snapshot = await db.collection('users').where('username', '==', givenUser).get();

    if (snapshot.empty) {
        return false;
    } else {
        snapshot.forEach(doc => {
            if (doc.data().password == givenPass) {
                console.log('yuh2')
                return true;
            } else {
                console.log('yuhf')
                return false;
            }
        });


    }

};

async function signup(givenUser, givenPass) {
    const snapshot = await db.collection('users').where('username', '==', givenUser).get();
    console.log(snapshot);
    if (snapshot.empty) {
        db.collection('users').add({ username: givenUser, password: givenPass });
        return true;

    } else {
        return false;

    }
};


module.exports = { login, signup }