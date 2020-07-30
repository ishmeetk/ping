const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const { v4: uuidV4 } = require('uuid')

app.set('view engine', 'ejs')
app.use(express.static('public'))

app.get('/', (req, res) => {
  res.redirect(`/${uuidV4()}`)
})

app.get('/:room', (req, res) => {
  res.render('room', { roomId: req.params.room })
})

io.on('connection', socket => { // STEP 1.1
  socket.on('join-room', (roomId, userId) => { // STEP 2.2
    socket.join(roomId)
    socket.to(roomId).broadcast.emit('user-connected', userId) // STEP 2.3

    socket.on('disconnect', () => {
      socket.to(roomId).broadcast.emit('user-disconnected', userId) // STEP 4
    })

    // TODO
    socket.on('pingUser', (data) => {
      // socket.to(roomId).broadcast.emit('start-ping', )
    })
  })
})

server.listen(process.env.PORT || 3000)