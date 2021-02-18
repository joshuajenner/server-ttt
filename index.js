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
let win = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]]



server.use(cors());
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({
  extended: true
}));

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
  console.log(gameRooms);
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

function joinGameRoom(room, passedID, passedName) {
  let roleTemp;
  let symbolTemp;
  let roomFound = false;
  for (r in gameRooms) {
    if (!gameRooms[r].roomcode.localeCompare(room)) {
      console.log("Room Found")
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
  // let roomFound = false;
  // for (r in gameRooms) {
  //   if (r.localeCompare(room)) {
  //     roomFound = true
  //     gameRooms[r][1].push(id);
  //   }
  // }
  // if (!roomFound) {
  //   gameRooms.push([room, [id], [0, 0, 0, 0, 0, 0, 0, 0, 0]])
  // }
}

function leaveGameRoom(room, id) {
  let roomEmpty = false
  for (r in gameRooms) {
    if (!gameRooms[r].roomcode.localeCompare(room)) {
      console.log("yup")
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

  // for (r in gameRooms) {
  //   if (gameRooms[r][0].localeCompare(room)) {
  //     for (i in gameRooms[r][1]) {
  //       if (!gameRooms[r][1][i].localeCompare(id)) {
  //         gameRooms[r][1].splice(i);
  //         if (gameRooms[r][1].length === 0) {
  //           roomEmpty = true
  //         }
  //       }
  //     }
  //     if (roomEmpty) {
  //       gameRooms.splice(r);
  //     }


  //   }
  // }
}


function checkWin(board) {
  let indexes = [];
  let symbols = [1, 2];

  for (s in symbols) {
    for (t in board) {
      if (board[t] === symbols[s]) {
        indexes.push(t);
      }
    }
  }

  if (board[0] === 1 && board[1] === 1 && board[2] === 1) {
    return 1;
  }
  if ((board[3] && board[4] && board[5]) === 1) {
    return 2;
  }
  if ((board[6] && board[7] && board[8]) === 1) {
    return 3;
  }
  if ((board[0] && board[3] && board[6]) === 1) {
    return 4;
  }
  if ((board[1] && board[4] && board[7]) === 1) {
    return 5;
  }
  if ((board[2] && board[5] && board[8]) === 1) {
    return 6;
  }
  if ((board[0] && board[4] && board[8]) === 1) {
    return 7;
  }
  if ((board[2] && board[4] && board[6]) === 1) {
    return 8;
  }

}


io.on("connection", (socket) => {
  socket.on("disconnecting", (reason) => {
    socket.rooms.forEach(r => {
      leaveGameRoom(r, socket.id);
    });
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

  });

  socket.on("leaveroom", (arg) => {
    leaveGameRoom(arg, socket.id);
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
        console.log(checkWin(gameRooms[b].board));

      }
    }

  });
});

// http.listen(port, hostname, () => {
http.listen(port, hostname, () => {
  console.log(`Server is listening`)
})
