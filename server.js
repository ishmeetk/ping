const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const { v4: uuidV4 } = require('uuid')

const socketIdToPeerId = {}

app.set('view engine', 'ejs')
app.use(express.static('public'))

app.get('/', (req, res) => {
  res.redirect(`/${uuidV4()}`)
})

app.get('/:room', (req, res) => {
  res.render('room', { roomId: req.params.room })
})

io.on('connection', socket => {
  socket.on('join-room', (roomId, peerId) => {
    socketIdToPeerId[socket.id] = peerId
    socket.join(roomId)
    socket.to(roomId).broadcast.emit('user-connected', JSON.stringify(
      {
        userId: userId,
        peerIds: Object.values(socketIdToPeerId) // array of all peer ids
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

    // socket.on('disconnect', () => { // reserved event
    //   socket.to(roomId).broadcast.emit('user-disconnected', userId)
    // })

    // TODO
    socket.on('pingUser', (data) => {
      // socket.to(roomId).broadcast.emit('start-ping', )
    })
  })
})

server.listen(process.env.PORT || 3000)
