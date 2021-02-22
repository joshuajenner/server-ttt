// const express = require('express')
// const server = express()
// const http = require('http').Server(express)
// const io = require('socket.io')(http);


//local url is http://localhost:5000
const server = require('express')();
const http = require('http').Server(server);
const io = require('socket.io')(http, {
  cors: {
    origin: "https://objective-jackson-bd6786.netlify.app/",
    methos: ["GET", "POST"]
  }
});
var cors = require('cors')
var bodyParser = require('body-parser')


const admin = require('firebase-admin');
const serviceAccount = require('./tictactoe-g2-8-fc37382609ff.json');

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// const hostname = '127.0.0.1';
const port = process.env.PORT || 3000;

let gameRooms = [];
let winConditions = ['012', '345', '678', '036', '147', '258', '048', '246'];



server.use(cors());
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({
  extended: true
}));


// Server Functions

server.get('/', (req, res) => {
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

server.post('/getrooms', async (req, res) => {
  res.send(gameRooms);
  res.end;
})

server.post('/initboard', async (req, res) => {
  for (r in gameRooms) {
    if (!gameRooms[r].roomcode.localeCompare(req.body.room)) {
      res.send(gameRooms[r].board);
    }
  }
  res.end;
})

// Internal Functions

function joinGameRoom(room, passedID, passedName) {
  let roleTemp;
  let symbolTemp;
  let roomFound = false;
  for (r in gameRooms) {
    if (!gameRooms[r].roomcode.localeCompare(room)) {
      roomFound = true;
      if (gameRooms[r].users.length === 0) {
        roleTemp = "player";
        symbolTemp = 1;
      } else if (gameRooms[r].users.length === 1) {
        roleTemp = "player"
        symbolTemp = 2;
      } else {
        roleTemp = "viewer"
        symbolTemp = 0
      }
      gameRooms[r].users.push({
        name: passedName,
        id: passedID,
        role: roleTemp,
        symbol: symbolTemp
      })
    }
  }
  if (!roomFound) {
    gameRooms.push({
      roomcode: room,
      users: [{
        name: passedName,
        id: passedID,
        role: "player",
        symbol: 1
      }],
      turn: passedName,
      board: [0, 0, 0, 0, 0, 0, 0, 0, 0]
    });
  }
}
function closeRoom(room) {
  for (r in gameRooms) {
    if (!gameRooms[r].roomcode.localeCompare(room)) {
      gameRooms.splice(r);
    }
  }
}
function leaveGameRoom(room, id) {
  let roomEmpty = false
  for (r in gameRooms) {
    if (!gameRooms[r].roomcode.localeCompare(room)) {
      for (u in gameRooms[r].users) {
        if (!gameRooms[r].users[u].id.localeCompare(id)) {
          gameRooms[r].users.splice(u);
          if (gameRooms[r].users.length === 0) {
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

function checkWin(board) {
  let indexes = "";
  let symbols = [1, 2];

  for (s in symbols) {
    indexes = '';
    for (t in board) {
      if (board[t] === symbols[s]) {
        indexes += t;
      }
    }
    for (win in winConditions) {
      if (indexes.includes(winConditions[win])) {
        return [true, winConditions[win]]
      }

    }
  }
  return [false, []]

}

function isAPlayer(id) {
  for (r in gameRooms) {
    for (u in gameRooms[r].users) {
      if(!gameRooms[r].users[u].id.localeCompare(id)) {
        if (!gameRooms[r].users[u].role.localeCompare("player")) {
          return true;
        }
      }
    }
  }
  return false;
}

// Socket IO Functions

io.on("connection", (socket) => {
  socket.on("disconnecting", (reason) => {
    socket.rooms.forEach(r => {
      if (isAPlayer(socket.id)) {
        socket.to(r).emit("playerdc");
        closeRoom(r);
      } else {
        leaveGameRoom(r, socket.id);
      }
    });
    io.emit("roomsrefreshed");
  });

  socket.on("joinroom", (arg) => {
    // arg 0 = room, 1 = username
    socket.join(arg[0]);
    joinGameRoom(arg[0], socket.id, arg[1]);
    for (r in gameRooms) {
      if (!gameRooms[r].roomcode.localeCompare(arg[0])) {
        io.to(arg[0]).emit('roominfo', [gameRooms[r].users, gameRooms[r].turn]);
      }
    }
    io.emit("roomsrefreshed");
  });

  socket.on("leaveroom", (arg) => {
    if (isAPlayer(socket.id)) {
      socket.to(arg).emit("playerdc");
      closeRoom(arg);
    } else {
      leaveGameRoom(arg, socket.id);
    }
    io.emit("roomsrefreshed");
  });

  socket.on("sendmove", (arg) => {
    // arg 0 = room, 1 = tile, 2 = user
    for (b in gameRooms) {
      if (!gameRooms[b].roomcode.localeCompare(arg[0])) {
        for (u in gameRooms[b].users) {
          if (!gameRooms[b].users[u].name.localeCompare(arg[2])) {
            gameRooms[b].board[arg[1]] = gameRooms[b].users[u].symbol
          }
          if (!gameRooms[b].users[u].role.localeCompare('player')) {
            if (gameRooms[b].users[u].name.localeCompare(gameRooms[b].turn) && gameRooms[b].users[u].name.localeCompare(arg[2])) {
              gameRooms[b].turn = gameRooms[b].users[u].name;
            }
          }
        }
        io.to(arg[0]).emit('boardchanged', [gameRooms[b].board, gameRooms[b].turn]);
        let winTemp = checkWin(gameRooms[b].board)
        if (winTemp[0]) {
          io.to(arg[0]).emit('winner', [arg[2], winTemp[1]]);
          closeRoom(arg[0]);
        }

      }
    }

  });
});

http.listen(port, () => {
  console.log(`Server is listening`)
})
