const express = require("express")
const http = require("http")
const app = express()
const server = http.createServer(app)
const io = require("socket.io")(server, {
    cors: {
        origin: "http://localhost:3000",
        method: ["GET", "POST"]
    }
});


io.on("connection", socket => {
    socket.emit("me", socket.id)

    socket.on("disconnect", () => {
        socket.broadcast.emit("callEnded")
    })

    socket.on("callUser", (data) => {
        io.to(data.userToCall).emit("callUser", { signal: data.signalData, from: data.from, name: data.name })

    })

    socket.on("answerCall", (data) => {
        io.to(data.to).emit("callAccepted", data.signal)
    })

    socket.on("sendMessage", (data) => {
        io.to(data.to).emit("sendMessage", data );
    });

})

server.listen(5000, () => console.log("running on port 5000"))