let user;

document.addEventListener("DOMContentLoaded", init)

class User {
    // static videoGrid = document.getElementById('video-grid')
    static peers = {}
    static peerStatuses = {} // object peerId(String):connected(Boolean)
    constructor() {
        this.socket = io('/')
        
        this.myPeer = new Peer(undefined, {
          host:'peerjs-server.herokuapp.com', secure:true, port:443
            // host: '/', port:3001
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
    document.getElementById('video-grid').append(video)
}

function connectToNewUser (myPeer, peerId, stream) {
    console.log('connectToNewUser')
    const call = myPeer.call(peerId, stream)
    console.log("Calling other peer")
    const video = document.createElement('video')

    call.on('stream', userVideoStream => {
        console.log("Accepted call from someone else")
        addVideoStream(video, userVideoStream)
    })
    call.on('close', () => {
        video.src
        video.remove()

    })

    User.peers[peerId] = call
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
            user.socket.on('user-connected', (data) => {
                data = JSON.parse(data);
                //{userId, peerIds}
                
                let peerId;
                // sync with server
                for (let i = 0; i < data.peerIds.length; i++) {
                    peerId = data.peerIds[i]
                    User.peerStatuses[peerId] = true
                }
                connectToNewUser(user.myPeer, data.peerId, stream)
            })
        })

        // update dynamic variable
        user.socket.on('user-disconnected', peerId => {
            
            //peerId.socket.close();
            //alert("event triggered");
            // console.log("triggered")
            
            // if(!User.peerStatuses[userId]) { // peerId(String):connected(Boolean)
            //     console.error("User was already disconnected, how did this happen?")
            // } else {
            //     User.peerStatuses[userId] = false // update dynamic variable
            // }
        })

        // runs when peerjs connection is made
        user.myPeer.on('open', peerId => {
            console.log("hello 3");
            console.log(user.myPeer);
            user.socket.emit('join-room', ROOM_ID, peerId, user.myPeer.close)
        })

        // handle current user disconnect
        //user.myPeer.on('disconnected', () => {
            // alert("bye");
            //user.socket.emit('leave-room', ROOM_ID, peerId)  
            
            //User.peers[userId].close() // close the video
        //})

        joinRoomBtn.classList.add("hidden");
    })
}

// TODO test out to see if peer is there but not showing
// TODO maybe try another browser popup