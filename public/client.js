
// TODO test out to see if peer is there but not showing
// TODO maybe try another browser popup

let user;

document.addEventListener("DOMContentLoaded", init)



/*
    Holds all the connection information used throughout this script
  
    Socket connection, peerjs connection, as well as the user's own video DOM object is stored here
  
*/
class User {
    static calls
    static inPing = false
    static calleeId
    static peers = {}
    static pingStatus = {}
    constructor() {
        
        this.socket = io('/')
        this.socket.on('connect', () => {
            
            
        })
        
        this.myPeerObj = new Peer(undefined, {
          host:'peerjs-server.herokuapp.com', secure:true, port:443
            // host: '/', port:3001
        })
        
        this.myVideo = document.createElement('video')
        this.myVideo.muted = true
    }
}

/*
    Displays video stream to HTML
  
    Renders the video stream through a provided HTML DOM element created by client.js.
    Then, appends the new video element to the DOM.
  
    Parameters: 
    video (DOMNode): HTML element to append to the DOM
    stream (MediaStream Object): Stream containing video and audio to stream
    https://developer.mozilla.org/en-US/docs/Web/API/MediaStream

    Returns: 
    null
  
*/
function addVideoStream(video, stream) {
    
    
    video.srcObject = stream

    // play stream in video
    video.addEventListener('loadedmetadata', () => {
        video.play()
    })

    // add video to HTML
    document.getElementById('video-grid').append(video)
}

/*
    Start a call with another peer
  
    Using the already established connection to the peer js server,
    start a call with another peer and send them the user's stream
  
    Parameters: 
    user (User class): Instance of User class 
    newPeerId (String): Peer's id to connect to via peer js
    myStream (MediaStream Object): Stream to send to other peer

    Returns: 
    null
  
*/
function connectToNewUser (user, newPeerId, myStream) {
    const { myPeerObj } = user
    
    const call = myPeerObj.call(newPeerId, myStream)
    const video = document.createElement('video')
    addPingListener(video, user)
    video.id = newPeerId
    call.on('stream', userVideoStream => {
        
        addVideoStream(video, userVideoStream)
    })
    call.on('close', () => {
        
        video.remove()
    })

    User.peers[newPeerId] = call
}

/*
    Handles the ping event on a click to a peer's video
  
    Assigns a click event listener to other peer's videos, which
    converts the necessary bidirectional connections into unidirectional
    connections.
  
    Parameters: 
    video (DOMNode): HTML element to append to the DOM
    user (User class): Instance of User class 
    https://developer.mozilla.org/en-US/docs/Web/API/MediaStream

    Returns: 
    null
  
*/
function addPingListener(video, user) {
    video.addEventListener('click', e => {
        
        const pingeePeerId = video.id
        const myPeerId = user.myPeerObj.id

        user.socket.emit("startPing", myPeerId, pingeePeerId)
    })
}


/*
    Main function that runs on page load
  
    Assigns an event listener to the join room button, which, on click, 
    will retrieve the user's media stream and set up listeners from 
    the Express server and other peers on the peer js server
  
    Parameters: 
    None

    Returns: 
    null
  
*/
function init() {
    const joinRoomBtn = document.getElementById("join-room");
    joinRoomBtn.addEventListener("click", function() {
        // create user object
        user = new User()
        

        // get user's video/audio
        navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        }).then(myStream => {
            
            addVideoStream(user.myVideo, myStream)

            // answer any calls from other peers from the peerjs server
            user.myPeerObj.on('call', call => {
                if (User.inPing) {
                    call.answer(null) // unidirectional
                } else {
                    call.answer(myStream) // bidirectional

                }
                const video = document.createElement('video')
                addPingListener(video, user)
                call.on('stream', peerStream => {
                    addVideoStream(video, peerStream)
                })
            })

            // connect to other peers already in peerjs server after socket has connected to express
            user.socket.on('user-connected', (data) => {
                data = JSON.parse(data);
                
                connectToNewUser(user, data.peerId, myStream)
            })

            user.socket.on("ping-rewire", peerInfo => {
                peerInfo = JSON.parse(peerInfo)
                const myPeerId = user.myPeerObj.id
                let id, inPing;
                User.inPing = peerInfo[myPeerId]
                if (User.inPing) {
                    Object.entries(peerInfo).forEach(entry => {
                        id = entry[0]
                        inPing = entry[1]
                        if (!inPing) { // make call to ping call member
                            User.peers[id] && User.peers[id].close()
                            // document.getElementById(id).remove() // close old bidirectional call
                        }
                    })
                    return // true if in ping call
                }
                

                // not in ping call, replace bidirectional call with unidirectional calls
                Object.entries(peerInfo).forEach(entry => {
                    
                    id = entry[0]
                    inPing = entry[1]
                    
                    if (inPing) { // make call to ping call member
                        User.peers[id] && User.peers[id].close() // close old bidirectional call
                        // document.getElementById(id).remove()
                        const call = user.myPeerObj.call(id, myStream) // make unidirectional call
                        call.on('stream', userVideoStream => {
                            console.error("This should never run")
                        })
                    }
                })
            })
        })

        user.socket.on('user-disconnected', peerId => {
            
            
            if (User.peers[peerId]) User.peers[peerId].close()
            
        })

        // runs when peerjs connection is made
        user.myPeerObj.on('open', myPeerId => {
            
            
            user.myVideo.id = myPeerId // store peer id in html
            user.socket.emit('join-room', ROOM_ID, myPeerId)
        })

        joinRoomBtn.classList.add("hidden");
    })
}