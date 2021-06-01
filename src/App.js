import Button from "@material-ui/core/Button"
import IconButton from "@material-ui/core/IconButton"
import TextField from "@material-ui/core/TextField"
import AssignmentIcon from "@material-ui/icons/Assignment"
import PhoneIcon from "@material-ui/icons/Phone"
import { CopyToClipboard } from "react-copy-to-clipboard"

import { BiMicrophone } from "react-icons/bi"
import { BiMicrophoneOff } from "react-icons/bi"
import { BiVideo } from "react-icons/bi"
import { BiVideoOff } from "react-icons/bi"
import { MdScreenShare } from "react-icons/md"
import { MdStopScreenShare } from "react-icons/md"



import './App.css';
import React, { useState, useEffect, useRef } from 'react'
import Peer from "simple-peer"
import io from "socket.io-client"
import { LinkedCamera } from "@material-ui/icons"

const socket = io.connect("http://localhost:5000")

function App() {
  const [me, setMe] = useState("")
  const [stream, setStream] = useState()
  const [receivingCall, setReceivingCall] = useState(false)
  const [caller, setCaller] = useState("")
  const [callerSignal, setCallerSignal] = useState()
  const [callAccepted, setCallAccepted] = useState(false)
  const [idToCall, setIdToCall] = useState("")
  const [callEnded, setCallEnded] = useState(false)
  const [name, setName] = useState("")
  const [muteIcon, setMuteIcon] = useState();
  const [videoIcon, setVideoIcon] = useState();
  const [shareIcon, setShareIcon] = useState();

  const [myScreen, setShareScreen] = useState(false);

  const myVideo = useRef()
  const userVideo = useRef()
  const connectionRef = useRef()


  useEffect(() => {
    setMuteIcon(<BiMicrophone />)
    setVideoIcon(<BiVideo />)
    setShareIcon(<MdScreenShare />)
    navigator.mediaDevices
      .getUserMedia({
        video: true,
        audio: true
      })
      .then((stream) => {
        setStream(stream)
        myVideo.current.srcObject = stream

      })

    socket.on('me', (id) => {
      setMe(id)
    })

    socket.on('callUser', (data) => {
      setReceivingCall(true)
      setCaller(data.from)
      setName(data.name)
      setCallerSignal(data.signal)
    })
  }, [])


  const callUser = (id) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: stream
    })
    peer.on("signal", (data) => {
      socket.emit("callUser", {
        userToCall: id,
        signalData: data,
        from: me,
        name: name
      })
    })
    peer.on("stream", (stream) => {
      userVideo.current.srcObject = stream

    })
    socket.on("callAccepted", (signal) => {
      setCallAccepted(true)
      peer.signal(signal)
    })

    connectionRef.current = peer
  }

  const showScreen = async () => {



    if (!myScreen) {
      try {
        navigator.mediaDevices
          .getDisplayMedia({
            video: {
              cursor: "always"
            },
            audio: false
          })
          .then((newStream) => {
           
            myVideo.current.srcObject = newStream
            

          })

          
        setShareIcon(<MdStopScreenShare />)

      } catch (err) {
        console.log(err);
      }
     
      setShareScreen(true)
    }
    else {
      try {
        navigator.mediaDevices
          .getUserMedia({
            video: true,
            audio: true
          })
          .then((newStream) => {
            
            myVideo.current.srcObject = newStream

          })

        
        setShareIcon(<MdScreenShare />)
      } catch (err) {
        console.log(err);
      }
      setShareScreen(false)

    }

  }

  const fullScreen = () => {

  }

  const answerCall = () => {
    setCallAccepted(true)
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: stream
    })
    peer.on("signal", (data) => {
      socket.emit("answerCall", { signal: data, to: caller })
    })
    peer.on("stream", (stream) => {
      userVideo.current.srcObject = stream

    })

    peer.signal(callerSignal)
    connectionRef.current = peer
  }



  const leaveCall = () => {
    setCallEnded(true)
    connectionRef.current.destroy()
  }

  const muteVideo = () => {
    const enabled = stream.getVideoTracks()[0].enabled;
    if (enabled) {
      stream.getVideoTracks()[0].enabled = false;
      setVideoIcon(<BiVideoOff />)
    }
    else {
      stream.getVideoTracks()[0].enabled = true;
      setVideoIcon(<BiVideo />)
    }

  }

  const muteAudio = () => {
    const enabled = stream.getAudioTracks()[0].enabled;
    if (enabled) {
      stream.getAudioTracks()[0].enabled = false;
      setMuteIcon(<BiMicrophoneOff />)
    }
    else {
      stream.getAudioTracks()[0].enabled = true;
      setMuteIcon(<BiMicrophone />)
    }
  }



  return (
    <>

      <h1 className="videochat__logo">Video chat</h1>

      <div className="container">
        <div className="video-container">
          <div className="videochat">
            <div className="video">
              {stream && <video id="myVideoStream" playsInline ref={myVideo} muted autoPlay style={{ width: "400px" }} />}

            </div>
            <div className="video">
              {callAccepted && !callEnded ?
                <video playsInline ref={userVideo} autoPlay style={{ width: "400px" }} /> :
                null}
            </div>
          </div>
          <div className="buttons">
            <Button variant="contained" color="primary" ref={myVideo} onClick={muteVideo} startIcon={videoIcon}></Button>
            <Button variant="contained" color="primary" ref={myVideo} onClick={muteAudio} startIcon={muteIcon}></Button>
            <Button variant="contained" color="primary" ref={myVideo} onClick={showScreen} startIcon={shareIcon}></Button>
          </div>
        </div>

        <div className="myId">
          <TextField
            id="filled-basic"
            label="Name"
            variant="filled"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ marginBottom: "20px" }}
          />
          <CopyToClipboard text={me} style={{ marginBottom: "2rem" }}>
            <Button variant="contained" color="primary" startIcon={<AssignmentIcon fontSize="large" />}>
              Copy ID
					</Button>
          </CopyToClipboard>

          <TextField
            id="filled-basic"
            label="ID to call"
            variant="filled"
            value={idToCall}
            onChange={(e) => setIdToCall(e.target.value)}
          />
          <div className="call-button">
            {callAccepted && !callEnded ? (
              <Button variant="contained" color="secondary" onClick={leaveCall}>
                End Call
              </Button>
            ) : (
              <IconButton color="primary" aria-label="call" onClick={() => callUser(idToCall)}>
                <PhoneIcon fontSize="large" />
              </IconButton>
            )}
            {idToCall}
          </div>
        </div>
        <div>
          {receivingCall && !callAccepted ? (
            <div className="caller">
              <h1 >{name} is calling...</h1>
              <Button variant="contained" color="primary" onClick={answerCall}>
                Answer
						</Button>
            </div>
          ) : null}
        </div>

      </div>
    </>
  );
}

export default App;
