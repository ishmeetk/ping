const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const { v4: uuidV4 } = require('uuid')

const peerInfo = {}
/*
{
  peerId(String): inPing(Boolean)
}
*/

app.set('view engine', 'ejs')
app.use(express.static('public'))

app.get('/', (req, res) => {
  res.redirect(`/${uuidV4()}`)
})

app.get('/:room', (req, res) => {
  res.render('room', { roomId: req.params.room })
  // res.redirect(req.baseUrl + req.params.room, {roomId: req.params.room })
})

io.on('connection', socket => {

  
  
  socket.on('join-room', (roomId, peerId) => {

    

    peerInfo[peerId] = 0

    socket.join(roomId)
    
    
    // broadcast to all clients in room including sender
    io.to(roomId).emit('user-connected', JSON.stringify(
      {
        peerId: peerId,
        // peerIds: Object.keys(peerInfo) // array of all peer ids
      }
    ))

    socket.on('startPing', (pingerPeerId, pingeePeerId) => {
      peerInfo[pingeePeerId] = 1
      peerInfo[pingerPeerId] = 1

      // tell clients to reconfigure connections for ping event
      io.to(roomId).emit('ping-rewire', JSON.stringify(peerInfo))
    })

    socket.on('disconnect', () => { // reserved event
      socket.to(roomId).broadcast.emit('user-disconnected', peerId);
    })

    // TODO
    socket.on('pingUser', (data) => {
      // socket.to(roomId).broadcast.emit('start-ping', )
    })
  })
})

server.listen(process.env.PORT || 3000)
