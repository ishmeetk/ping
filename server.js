const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const { v4: uuidV4 } = require('uuid')

const socketIdToPeer = {}

/*
  socketIdtoPeer"::::

  Socket -> object {
    -> peerId, close
  }

*/

app.set('view engine', 'ejs')
app.use(express.static('public'))

app.get('/', (req, res) => {
  res.redirect(`/${uuidV4()}`)
})

app.get('/:room', (req, res) => {
  res.render('room', { roomId: req.params.room })
})

io.on('connection', socket => {

  console.log("hello 1");
  
  socket.on('join-room', (roomId, peer_id, closeConnection) => {

    console.log("hello 2");

    socketIdToPeer[socket.id] = {peerId: peer_id, close: closeConnection}

    socket.join(roomId)

    socket.to(roomId).broadcast.emit('user-connected', JSON.stringify(
      {
        peerId: peer_id,
        
        peerIds: Object.values(socketIdToPeer).map(peer => peer.id) // array of all peer ids
      }
    ))

    
    
    socket.on('leave-room', () => {
      delete socketIdToPeerId[peerId] // update peer variable that peer has left

      // tell all other clients to update their peer id list
      socket.to(roomId).broadcast.emit('user-disconnected', JSON.stringify(
        {
          peerIds: Object.values(socketIdToPeerId) // array of all peer ids
        }
      ))
    })

    socket.on('disconnect', () => { // reserved event
      //user.myPeer.on('disconnected', () => {
        //socket.emit('leave-room', ROOM_ID, peerId)  
      //peers[userId].close(); // close the video  //})

      //Test
      //console.log(socketIdToPeer);

      // socketIdToPeer[socket.id].close();
      socket.to(roomId).broadcast.emit('user-disconnected', 
      socketIdToPeer[socket.id].peerId);
    })

    // TODO
    socket.on('pingUser', (data) => {
      // socket.to(roomId).broadcast.emit('start-ping', )
    })
  })
})

server.listen(process.env.PORT || 3000)
