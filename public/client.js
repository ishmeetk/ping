let user;

document.addEventListener("DOMContentLoaded", init)

class User {
    // static videoGrid = document.getElementById('video-grid')
    static peers = {}
    static peerStatuses = {} // object peerId(String):{connected(Boolean), stream(Object)}(Object)
// TODO last resort bad unscalable data structure for streams
// 1 -> 2
// 1 -> 3
// [
//     [1, 2, data],
//     [1, 3, dataOther]
// ]
    constructor() {
        console.log("Started io connection")
        this.socket = io('/')
        this.socket.on('connect', () => {
            console.log("Finished io connection")
            console.log(this.socket.id)
        })
        console.log("Started peerjs connection")
        this.myPeerObj = new Peer(undefined, {
          //host:'peerjs-server.herokuapp.com', secure:true, port:443
            host: '/', port:3001
        })
        
        this.myVideo = document.createElement('video')
        this.myVideo.muted = true
    }


}

function addVideoStream(video, stream) {
    console.log("Adding video stream")
    console.log(stream)
    video.srcObject = stream

    // play stream in video
    video.addEventListener('loadedmetadata', () => {
        video.play()
    })

    // add video to HTML
    document.getElementById('video-grid').append(video)
}

function connectToNewUser (user, newPeerId, myStream) {
    const { myPeerObj } = user
    console.log('connectToNewUser')
    const call = myPeerObj.call(newPeerId, myStream)
    console.log("Calling other peer")
    const video = document.createElement('video')
    addPingListener(video, user)
    video.id = newPeerId
    call.on('stream', userVideoStream => {
        console.log("Showing whoever called us's video")
        addVideoStream(video, userVideoStream)

    })
    call.on('close', () => {
        video.remove()
    })

    User.peers[newPeerId] = call
}

// add a click event for pinging
function addPingListener(video, user) {
    video.addEventListener('click', e => {
        console.log(user)
        const peerIds = Object.keys(User.peerStatuses) // TODO this needs the stream objects
        console.log('Clicked')
        // turn off video/audio streaming in all other peers

        for (let i = 0; i < peerIds.length; i++) {
            console.log("PeerIds[i]:"+ peerIds[i])
            
            if (peerIds[i] !== video.id && peerIds[i] !== user.myPeerObj.id) {
                console.log('should run once')
                // stream.getTracks()[0].stop() // audio
                // stream.getTracks()[1].stop() // video
            }
        }
    })
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
            user.myPeerObj.on('call', call => {
                console.log("Received call")
                console.log(call)
                call.answer(stream)

                const video = document.createElement('video')
                addPingListener(video, user)
                call.on('stream', userVideoStream => {
                    console.log("Showing the person we called's video")
                    console.log(userVideoStream)
                    addVideoStream(video, userVideoStream)
                })
            })

            // connect to other peers already in peerjs server after socket has connected to express
            user.socket.on('user-connected', (data) => {
                data = JSON.parse(data);
                console.log(data)
                let peerId;
                // sync with server
                for (let i = 0; i < data.peerIds.length; i++) {
                    console.log("Loop: i -> " + i)
                    console.log(User.peerStatuses)
                    peerId = data.peerIds[i]

                    // TODO store streams here?
                    User.peerStatuses[peerId] = {
                        connected: true,
                        stream: stream,
                        // receiverPeerId: 
                    }
                }
                connectToNewUser(user, data.peerId, stream)
            })
        })

        // update dynamic variable
        // user.socket.on('user-disconnected', peerIds => {
        //     console.log(User.peers)
        //     console.log(peerId)
        //     User.peers[peerId].close()
        //     alert("event triggered");
        //     // console.log("triggered")
            
        //     if(!User.peerStatuses[peerId]) { // peerId(String):connected(Boolean)
        //         console.error("User was already disconnected, how did this happen?")
        //     } else {
        //         User.peerStatuses[peerId] = false // update dynamic variable
        //     }
        // })

        // runs when peerjs connection is made
        user.myPeerObj.on('open', myPeerId => {
            console.log("PeerJS finished connection")
            console.log("Peer id: ", myPeerId)
            user.myVideo.id = myPeerId // store peer id in html
            user.socket.emit('join-room', ROOM_ID, myPeerId)
        })

        // handle current user disconnect
        user.myPeerObj.on('close', () => {
            user.socket.emit('leave-room', ROOM_ID, peerId)  
            // TODO need to update server's dynamic variables
        })

        joinRoomBtn.classList.add("hidden");
        //console.log(user.id)
        console.log("End of function")
    })
}

// TODO test out to see if peer is there but not showing
// TODO maybe try another browser popup