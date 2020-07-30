# Typical scenerio of the current code
1. User visits the url to join the room
2. User joins the peerjs server, and user is also connected to a socket.io server (handled through the site's express code). Listeners are also set up (not run yet) in both the express server and client's JS script
3. At the same time as step 2, the site asks user for permission to access their microphone and video. This creates the user's stream. The user displays this stream, so they can see themselves but also sends it to their peers.
4. Peers who have gone through steps 1-3 will have their own stream playing muted for themselves. They have set up listeners and will wait for calls from other peers to run step 3. Upon receiving a call, they will receive a stream with this call and display it for themselves through a video grid.
5. Disconnecting from the peerjs server will freeze their stream for any other user. After a delay, the peer's stream will automatically remove itself (a peerjs thing?). However, with the use of socket.io, this disconnection message is communicated more rapidly to the remaining users.

# Line-specific steps
I use "current user" frequently. It refers to whoever opened the url in their browser (the user that is not the peers).

There are sub-steps to indicate steps happen at the same time, instead of a linear transition of steps. This means STEP 1 occurs at the same time as STEP 2

## STEP 1 Establish socket connection to Express server
     script.js:1
       Connect to the express socket server

  ### STEP 1.1
        server.js:18
          Set up listener for 'join-room' messages

## STEP 2 Establish connection to the peerjs server and call the peer
  Line 5: Connect to peerjs server
### STEP 2.1
        script.js:45
          Send socket message to express server
  ### STEP 2.2
        server.js:19
          Current user joins socket room (socket.io has objects called "Rooms", where broadcasts made to this room can only be heard by clients in that room)
  ### STEP 2.3
        server.js:21
          send a socket message of 'user-connected' to all clients in the room except the current user (so, this is all the peers)
  ### STEP 2.4
        script.js:34
          All of the current user's peers already in the room will run this line. They will call the current user (all peers already in the room during the broadcast of STEP 2.3 will do this)
## STEP 3 Send the current user's stream to their peers
  script.js:15
      Request the current user's  camera and microphone and returns a stream of this data (the stream variable on line 18)
  ### STEP 3.1
    script.js:24
        Wait for a call from a peer from the peerjs server. Lines 25-29 should run after a peer runs line 50.
  ### STEP 3.2
    script.js:33
        Wait for socket messages that are 'user-connected'
## STEP 4 A user disconnects
  server.js:24
      Send a socket message 'user-disconnected' to everyone except the socket that just disconnected (the current user triggers this)
  ### STEP 4.1
    script.js:40
        Close the peerjs connection for that userId that just left (everyone but the current user calls this, eventually the last user will trigger STEP 4 but no user will be left to run STEP 4.1)

Possible solution:
Sending audio/video stream through socket.io instead of peerjs (we may need to configure our peerjs server)
https://stackoverflow.com/questions/49868353/send-video-audio-over-socket-io-from-browser