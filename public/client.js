let user;

document.addEventListener("DOMContentLoaded", init)

class User {
    // static videoGrid = document.getElementById('video-grid')
    static peers = {}
    static peerStatuses = {} // object peerId(String):connected(Boolean)
    constructor() {
        console.log("Started io connection")
        this.socket = io('/')
        this.socket.on('connect', () => {
            console.log("Finished io connection")
            console.log(this.socket.id)
        })
        console.log("Started peerjs connection")
        this.myPeer = new Peer(undefined, {
          host:'peerjs-server.herokuapp.com', secure:true, port:443
            // host: '/', port:3001
        })
        
        this.myVideo = document.createElement('video')
        this.myVideo.muted = true
    }
}

function addVideoStream(video, stream) {
    console.log("Adding video stream")
    console.log(stream)
    video.srcObject = stream
    video.addEventListener('loadedmetadata', () => {
        video.play()
    })
    document.getElementById('video-grid').append(video)
}

function connectToNewUser (myPeer, peerId, myStream) {
    console.log('connectToNewUser')
    const call = myPeer.call(peerId, myStream)
    console.log("Calling other peer")
    const video = document.createElement('video')

    call.on('stream', userVideoStream => {
        console.log("Showing whoever called us's video")
        addVideoStream(video, userVideoStream)
    })
    call.on('close', () => {
        video.remove()
    })

    User.peers[peerId] = call
}
  
function init() {
    const joinRoomBtn = document.getElementById("join-room");
    joinRoomBtn.addEventListener("click", function() {
        // create user object
        user = new User()
        console.log('Initialized user')

        // get user's video/audio
        navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
        }).then(stream => {
            console.log("Gave permission")
            addVideoStream(user.myVideo, stream)

            // answer any calls from other peers from the peerjs server
            user.myPeer.on('call', call => {
                console.log("Received call")
                console.log(call)
                call.answer(stream)

                const video = document.createElement('video')
                call.on('stream', userVideoStream => {
                    console.log("Showing the person we called's video")
                    console.log(userVideoStream)
                    addVideoStream(video, userVideoStream)
                })
            })

            // connect to other peers already in peerjs server after socket has connected to express
            user.socket.on('user-connected', (data) => {
                data = JSON.parse(data);
                
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
            console.log("PeerJS finished connection")
            console.log("Peer id: ", peerId)
            user.socket.emit('join-room', ROOM_ID, peerId)
        })

        // handle current user disconnect
        //user.myPeer.on('disconnected', () => {
            // alert("bye");
            //user.socket.emit('leave-room', ROOM_ID, peerId)  
            
            //User.peers[userId].close() // close the video
        //})

        joinRoomBtn.classList.add("hidden");
        //console.log(user.id)
        console.log("End of function")
    })
}

// TODO test out to see if peer is there but not showing
// TODO maybe try another browser popup