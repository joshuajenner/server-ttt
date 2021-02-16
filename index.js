// const express = require('express')
// const server = express()
// const http = require('http').Server(express)
// const io = require('socket.io')(http);

const server = require('express')();
const http = require('http').Server(server);
const io = require('socket.io')(http, {
  cors: {
    origin: "http://localhost:5000",
    methos: ["GET", "POST"]
  }
});
var cors = require('cors')
var bodyParser = require('body-parser')


const admin = require('firebase-admin');
const serviceAccount = require('./tictactoe-g2-8-fc37382609ff.json');

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const hostname = '127.0.0.1';
const port = process.env.PORT || 3000;




let gameRooms = [];




server.use(cors());
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({
  extended: true
}));

server.get('/', (req, res) => {
  console.log("hey");
  res.send('G2-8 TicTacToe Server');
})

server.post('/login', async (req, res) => {
  if (req.body.loginUser != undefined && req.body.loginPass != undefined) {
    const snapshot = await db.collection('users').where('username', '==', req.body.loginUser).get();
    if (snapshot.empty) {
      res.send({ message: "Username not found.", success: false })
    } else {
      snapshot.forEach(doc => {
        if (doc.data().password == req.body.loginPass) {
          res.send({ message: "Logged in successfully.", success: true, username: doc.data().username });
        } else {
          res.send({ message: "Password is incorrect.", success: false })
        }
      });
    }
  } else {
    res.send({ message: "Please fill in all fields." });
  }
  res.end()
})

server.post('/signup', async (req, res) => {
  if (req.body.signUser != undefined && req.body.signPass != undefined) {
    const snapshot = await db.collection('users').where('username', '==', req.body.signUser).get();
    if (snapshot.empty) {
      db.collection('users').add({ username: req.body.signUser, password: req.body.signPass });
      res.send({ message: "Signup successful! Please click below to login" });
    } else {
      res.send({ message: 'Error! Username is already taken.' });
    }
  } else {
    res.send({ message: "Please fill in all fields." });
  }
  res.end()
})

function joinGameRoom(room, id) {
  let roomFound = false;
  for (r in gameRooms) {
    if (!r.localeCompare(room)) {
      roomFound = true
    }
  }
  if(!roomFound) {
    gameRooms.push([room, [id]])
  }
  console.log(gameRooms);
}

function leaveGameRoom(room, id) {
  let roomEmpty = false
  for (r in gameRooms) {
    if (gameRooms[r][0].localeCompare(room)) {
      for (i in gameRooms[r][1]) {
        if (!gameRooms[r][1][i].localeCompare(id)) {
          gameRooms[r][1].splice(i);
          if (gameRooms[r][1].length === 0) {
            roomEmpty = true
          }
        }
      }
      if (roomEmpty) {
        gameRooms.splice(r);
      }
      

    }
  }
}

io.on("connection", (socket) => {
  socket.on("disconnecting", (reason) => {
    socket.rooms.forEach(r => {
      console.log(r)
      leaveGameRoom(r, socket.id);
    });
    console.log(gameRooms);
  });

 socket.on("joinroom", (arg) => {
   socket.join(arg);
   joinGameRoom(arg, socket.id);
 });

 socket.on("leaveroom", (arg) => {
  leaveGameRoom(arg, socket.id);
 });

 socket.on("listrooms", () => {

  // socket.emit("updaterooms", map_to_object(io.sockets.adapter.rooms));
  socket.emit("updaterooms", gameRooms);
 })
});



// http.listen(port, hostname, () => {
http.listen(port, hostname, () => {
  console.log(`Server is listening`)
})
