const express = require('express')
const server = express()
var cors = require('cors')
var bodyParser = require('body-parser')


const admin = require('firebase-admin');
const serviceAccount = require('./tictactoe-g2-8-fc37382609ff.json');

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const hostname = '127.0.0.1';
const port = 3000;



server.use(cors());
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ 
  extended: true
})); 

server.get('/', (req, res) => {
  res.send('Hello World!');
  console.log("home")
})

server.post('/login', async (req, res) => {
  if (req.body.loginUser != undefined && req.body.loginPass != undefined) {
    const snapshot = await db.collection('users').where('username', '==', req.body.loginUser).get();
    if (snapshot.empty) {
        res.send({message: "Username not found."})
    } else {
        snapshot.forEach(doc => {
            if (doc.data().password == req.body.loginPass) {
                res.send({message: "success"});
            } else {
                res.send({message: "Password is incorrect."})
            }
        });
    }
  } else {
    res.send({message: "Please fill in all fields."});
  }
    res.end()
})

server.post('/signup', async (req, res) => {
  if (req.body.signUser != undefined && req.body.signPass != undefined) {
    const snapshot = await db.collection('users').where('username', '==', req.body.signUser).get();
    if (snapshot.empty) {
        db.collection('users').add({ username: req.body.signUser, password: req.body.signPass});
        res.send({message: "Signup successful! Please click below to login"});
    } else {
        res.send({message: 'Error! Username is already taken.'});
    }
  } else {
    res.send({message: "Please fill in all fields."});
  }
  res.end()
})


server.listen(port, hostname, () => {
  console.log(`Example app listening at http://${hostname}:${port}`)
})
