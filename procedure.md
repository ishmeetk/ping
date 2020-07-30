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