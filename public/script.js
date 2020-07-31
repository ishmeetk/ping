let user;

document.addEventListener("DOMContentLoaded", init)

class User {
    static videoGrid = document.getElementById('video-grid')
    static peers = {}
    static peerStatuses = {} // object peerId(String):connected(Boolean)
    constructor() {
        this.socket = io('/')
        
        this.myPeer = new Peer(undefined, {
          host:'peerjs-server.herokuapp.com', secure:true, port:443
        })
        
        this.myVideo = document.createElement('video')
        this.myVideo.muted = true
    }
}

function addVideoStream(video, stream) {
    video.srcObject = stream
    video.addEventListener('loadedmetadata', () => {
        video.play()

    })
    User.videoGrid.append(video)
}

function connectToNewUser (myPeer, userId, stream) {
    const call = myPeer.call(userId, stream)
    const video = document.createElement('video')

    call.on('stream', userVideoStream => {
        addVideoStream(video, userVideoStream)
    })
    call.on('close', () => {
        video.remove()
    })

    User.peers[userId] = call
}
  
function init() {
    const joinRoomBtn = document.getElementById("join-room");
    joinRoomBtn.addEventListener("click", function() {
        // create user object
        user = new User()

        // get user's video/audio
        navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
        }).then(stream => {
            addVideoStream(user.myVideo, stream)

            // answer any calls from other peers from the peerjs server
            user.myPeer.on('call', call => {
                call.answer(stream)

                const video = document.createElement('video')
                call.on('stream', userVideoStream => {
                    addVideoStream(video, userVideoStream)
                })
            })

            // connect to other peers already in peerjs server after socket has connected to express
            user.socket.on('user-connected', ({userId, peerIds}) => {
                let peerId;
                // sync with server
                for (let i = 0; i < peerIds.length; i++) {
                    peerId = peerIds[i]
                    User.peerStatuses[peerid] = true
                }
                user.connectToNewUser(user.myPeer, userId, stream)
            })
        })

        // update dynamic variable
        user.socket.on('user-disconnected', userId => {
            if(!User.peerStatuses[userId]) { // peerId(String):connected(Boolean)
                console.error("User was already disconnected, how did this happen?")
            } else {
                User.peerStatuses[userId] = false // update dynamic variable
            }
        })

        // runs when peerjs connection is made
        user.myPeer.on('open', peerId => {
            user.socket.emit('join-room', ROOM_ID, peerId)  
        })

        // handle current user disconnect
        user.myPeer.on('disconnected', () => {
            User.peers[userId].close() // close the video
            user.socket.emit('leave-room', ROOM_ID, peerId)  
        })

        joinRoomBtn.classList.add("hidden");
        console.log(user.id)
    })
}

