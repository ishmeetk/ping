const socket = io('/') // STEP 1
const videoGrid = document.getElementById('video-grid')

// generate current user's peer object
const myPeer = new Peer(undefined, { // STEP 2: let the peerjs server generate id
  host:'peerjs-server.herokuapp.com', secure:true, port:443
})

const myVideo = document.createElement('video')
myVideo.muted = true // mute current user for current user only
const peers = {}
const userIds = {}

// get current user's stream to send to peers
navigator.mediaDevices.getUserMedia({ // STEP 3
  video: true, // include video in stream
  audio: true // include audio in stream
}).then(stream => { // current user's stream
  console.log(stream.getTracks())
  // add current user's stream to current user's page
  addVideoStream(myVideo, stream)

  // respond to call from peer
  myPeer.on('call', call => { // STEP 3.1
    call.answer(stream) // send peer the current user's stream
    const video = document.createElement('video')
    call.on('stream', userVideoStream => {
      addVideoStream(video, userVideoStream)
    })
  })

  // express says another user connected, send them the current user's stream
  socket.on('user-connected', userId => { // STEP 3.2
    connectToNewUser(userId, stream) // STEP 2.4
  })
})

// peer disconnected
socket.on('user-disconnected', userId => {
  if (peers[userId]) peers[userId].close() // STEP 4.1
})

// runs after current user has connected to peerjs server
myPeer.on('open', id => {
  socket.emit('join-room', ROOM_ID, id) // STEP 2.1: inform express with peerjs ID
})

// make call to connect to other new peer
function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream) // call user with userId and send current user's stream
  const video = document.createElement('video')
  call.on('stream', userVideoStream => {
    addVideoStream(video, userVideoStream)
  })
  call.on('close', () => {
    video.remove()
  })

  userIds[video] = userId // store mapping of user id to DOM video
  peers[userId] = call
}

// connect stream to video DOM
function addVideoStream(video, stream) {
  console.log("addVideoStream")
  video.srcObject = stream
  video.addEventListener('loadedmetadata', () => {
    video.play()
  })

  videoGrid.append(video) // add video DOM node to page

  // TODO
  // video.addEventListener("click", () => {
  //   console.log(video)
  //   console.log(userIds)
  //   socket.emit('pingUser',
  //     {
  //       videoGrid: video, // DOM element
  //       userId: userIds[video]
  //     }
  //   )
  // })
}