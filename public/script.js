let user;

document.addEventListener("DOMContentLoaded", init)

class User {
    static videoGrid = document.getElementById('video-grid')
    static peers = {}

    constructor() {
        this.socket = io('/')
        
        this.myPeer = new Peer(undefined, {
            host: '/',
            port: '3001'
        })
        
        this.myVideo = document.createElement('video')
        this.myVideo.muted = true
    }

    connectToNewUser (userId, stream) {
        const call = this.myPeer.call(userId, stream)
        const video = document.createElement('video')

        call.on('stream', userVideoStream => {
            addVideoStream(video, userVideoStream)
        })
        call.on('close', () => {
            video.remove()
        })

        User.peers[userId] = call
    }
}

function addVideoStream(video, stream) {
    video.srcObject = stream
    video.addEventListener('loadedmetadata', () => {
        video.play()

    })
    User.videoGrid.append(video)
}

function init() {
    const joinRoomBtn = document.getElementById("join-room");
    joinRoomBtn.addEventListener("click", function() {
        user = new User()

        // get user's video/audio
        navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
        }).then(stream => {
            addVideoStream(user.myVideo, stream)

            user.myPeer.on('call', call => {
                call.answer(stream)

                const video = document.createElement('video')
                call.on('stream', userVideoStream => {
                    addVideoStream(video, userVideoStream)
                })
            })
            user.socket.on('user-connected', userId => {
                user.connectToNewUser(userId, stream)
            })

        })

        user.socket.on('user-disconnected', userId => {
            if(User.peers[userId])
                User.peers[userId].close()
        })

        user.myPeer.on('open', id => {
            user.socket.emit('join-room', ROOM_ID, id)  
        })

        joinRoomBtn.classList.add("hidden");
    })
}

