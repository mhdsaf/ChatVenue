// to be able to use web sockets, we just need to configure express in a different way

const Cryptr = require('cryptr');

const cryptr = new Cryptr(process.env.privkey);

const http = require('http');

const axios = require('axios');

const socketio = require('socket.io');

const express = require('express');

const path = require('path');

const app = express();

const server = http.createServer(app);

const io = socketio(server);

const hbs = require('hbs');

const port = process.env.PORT;

const bcrypt = require('bcrypt');

require('./db/dbConnect');

const rooms = require('./models/rooms');
const { log } = require('console');
const { findByIdAndDelete } = require('./models/rooms');

app.use(express.json());

const publicDirectoryPath = path.join(__dirname, '../public');
const viewsDirectoryPath = path.join(__dirname,'../templates/views');
const partialsDirectoryPath = path.join(__dirname, '../templates/partials');

app.set('view engine','hbs');
app.set('views',viewsDirectoryPath);
hbs.registerPartials(partialsDirectoryPath);

app.use(express.static(publicDirectoryPath));

app.get('', async(req,res)=>{
    res.render('index');
});

app.get('/about', async(req,res)=>{
    res.render('about');
});

app.get('/chat', async(req,res)=>{ // redirect users to this page once they create/join a room
    res.render('chat');
})

io.on('connection', async (socket)=>{
    socket.on('createRoom', async (room, password, nick, id)=>{
        var x = room;
        const hashRoom = await bcrypt.hash(room, 8);
        const hashPass = await bcrypt.hash(password, 8);
        const arr = [{
            name: nick,
            id: id
        }]
        const Prom1 = await new rooms({name: hashRoom, password: hashPass,  users: arr});
        await Prom1.save();
        console.log("Creating room: " + room);
        socket.chatRoom = room;
        socket.username = nick
        socket.join(room);
        console.log(x);
        io.sockets.in(x).emit('userList', [nick]);
    });
    socket.on('enterRoom', async(room, nick)=>{
        var nick1 = nick;
        let arr = [];
        const Prom1 = await rooms.find({});
        Prom1.forEach( async(element) => {
            let nMatch = await bcrypt.compare(room, element.name);
            if(nMatch){
                arr = [...element.users];
                console.log('arr ' + arr);
                let obj = {
                    name: nick1,
                    id: socket.id
                }
                arr.push(obj);
                element.users = arr;
                console.log(nick1);
                await element.save();
                console.log('Joined room: ' + room);
                socket.chatRoom = room;
                socket.username = nick1
                socket.join(room);
                io.sockets.in(room).emit('userList', arr);
                return false;
            }
        });
    })
    socket.on('getURL', async (room, password)=>{
        console.log('Checking if rooms exists');
        const Prom1 = await rooms.find({});
        let match = false;
        if(Prom1.length==0){
            console.log('Good to go!', match);
            const cipherRoom = await cryptr.encrypt(room);
            const cipherPass = await cryptr.encrypt(password);
            socket.emit('URL', cipherRoom, cipherPass, true);
        }
        Prom1.forEach(async(element, index) => {
            const x = await bcrypt.compare(room, element.name);
            if(x){
                match = true;
                socket.emit('URL', "cipherRoom", "cipherPass", false);
                return false;
            }
            if(index==Prom1.length-1 && match==false){
                console.log('Good to go!', match);
                const cipherRoom = await cryptr.encrypt(room);
                const cipherPass = await cryptr.encrypt(password);
                socket.emit('URL', cipherRoom, cipherPass, true);
            }
        });
    })
    socket.on('join', async (room, pass)=>{ // user joing a room
        const plainName = cryptr.decrypt(room);
        const plainPass = cryptr.decrypt(pass);
        const Prom1 = await rooms.find();
        Prom1.forEach( async (element) => {
            let nMatch = await bcrypt.compare(plainName, element.name);
            let pMatch = await bcrypt.compare(plainPass, element.password);
            if(nMatch && pMatch){
                socket.emit('roomName', plainName);
            }
        });
    });
    socket.on('checkRoom', async (room, pass, ack)=>{
        const plainName = room;
        const plainPass = pass;
        let match = false;
        const Prom1 = await rooms.find();
        if(Prom1.length==0){
            ack('ajhsdhjv')
        }else{
            await Prom1.forEach( async (element, index) => {
                let nMatch = await bcrypt.compare(plainName, element.name);
                let pMatch = await bcrypt.compare(plainPass, element.password);
                if(nMatch && pMatch){
                    match = true;
                    console.log('found room!!!!')
                }
                if(index==Prom1.length-1){
                    if(match){
                        console.log('FOUNDDD')
                        ack('found')
                    }else{
                        console.log('NNNNFOUNDDD')
                        ack('agsdad')
                    }
                }
            });
        }
    });
    socket.on('accessRoom', async(room, nick, id)=>{
        var nick1 = nick;
        let arr = [];
        const Prom1 = await rooms.find({});
        Prom1.forEach( async(element) => {
            let nMatch = await bcrypt.compare(room, element.name);
            if(nMatch){
                arr = [...element.users];
                console.log('arr ' + arr);
                let obj = {
                    name: nick1,
                    id: id
                }
                arr.push(obj);
                element.users = arr;
                console.log(nick1);
                await element.save();
                console.log('Joined room: ' + room);
                socket.chatRoom = room
                socket.username = nick1;
                socket.join(room);
                io.sockets.in(room).emit('userList', arr);
                return false;
            }
        });
    })
    socket.on('newMsg', (text, room)=>{
        console.log("Sending msg to members")
        io.to(room).emit('renderMsg', text, socket.username);
    });
    socket.on('location', (object, room, ack)=>{
        let obj = {
            msg: `Hello, I am texting from ${object.location}`,
            link : `${object.link}`
        }
        io.sockets.in(room).emit('shareLocation', obj, socket.username);
        ack('Location sent successfully');
    });
    socket.on('endRoom', async(room)=>{
        const Prom1 = await rooms.find({});
        Prom1.forEach(async(element) => {
            let nMatch = await bcrypt.compare(room, element.name);
            if(nMatch){
                let id = element._id;
                await rooms.findByIdAndDelete(id);
                io.sockets.in(room).emit('out');
                return false; 
            }
        });
        
    })
    socket.on('disconnect', async()=>{
        console.log("Socket " + socket.id + ' left the room: ' + socket.chatRoom);
        const Prom1 = await rooms.find({});
        Prom1.forEach((element,index1) => {
            element.users.forEach(async(element1, index) => {
                if(element1.id==socket.id){
                    arr = [...element.users];
                    arr.splice(index, 1);
                    console.log('******'+arr.length)
                    let id = element._id;
                    if(arr.length==0){
                        await rooms.findByIdAndDelete(id);
                    }else{
                        const doc = await rooms.findById(id);
                        doc.users = arr;
                        await doc.save();
                        socket.broadcast.to(socket.chatRoom).emit('userList', arr);
                    }
                    return false;
                }
            });
        });
    })
});
app.post('/try', (req,res)=>{
    console.log("Location")
    const lat = req.body.lat;
    const long = req.body.long;
    console.log(lat,long);
    let results;
    axios({
        method: 'get', //you can set what request you want to be
        url: `https://api.mapbox.com/geocoding/v5/mapbox.places/${long},${lat}.json?access_token=pk.eyJ1IjoibWhkc2FmIiwiYSI6ImNrYWkyY2JrZTA2Yzgyc3MwZzh2cnRveG4ifQ.j1jbkXv8N_mdabWb_ZjYVA`,
        headers: {
            'Content-Type': 'application/json'
        }
      }).then(response=>{
          console.log(response.data);
          res.send(response.data)
      }).catch(error=>{
          console.log(error)
      });
});

server.listen(port, ()=>{
    console.log("Server is up on running!");
    console.log(port)
})