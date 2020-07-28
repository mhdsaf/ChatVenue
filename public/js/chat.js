$(document).ready(function () {
    
    console.log(localStorage.getItem('URL'));
    const socket = io();
    setTimeout(() => {
        //$("#send").prop("disabled",true);
        $("#send").hide();
        $("#msg").keyup(function (e) {
            e.preventDefault();
            if($("#msg").val().trim()!=""){
                //$("#send").prop("disabled",false);
                $("#send").show();
            }else{
                //$("#send").prop("disabled",true);
                $("#send").hide();
            }
        });
        $("#msg").focusout(function (e) { 
            e.preventDefault();
            if($("#msg").val().trim()!=""){
                //$("#send").prop("disabled",false);
                $("#send").show();
            }else{
                //$("#send").prop("disabled",true);
                $("#send").hide();
            }
        });

        console.log('My socket ID: ' + socket.id);
        var chatRoom;
        var username;
        if(localStorage.getItem('jRoom')=='' && localStorage.getItem('check')==''){ // user is creating a room
            console.log("Creating room!");
            const room = localStorage.getItem('room');
            const pass = localStorage.getItem('pass');
            const nick = localStorage.getItem('nick1');
            username = nick
            socket.emit('createRoom', room, pass, nick, socket.id);
            chatRoom = room;
            
        }else if(localStorage.getItem('check')!=''){
            console.log(localStorage.getItem('nick3'))
            username = localStorage.getItem('nick3')
            socket.emit('accessRoom', localStorage.getItem('check'), localStorage.getItem('nick3'), socket.id);
            chatRoom = localStorage.getItem('check');
            console.log(chatRoom);
            $("#end").hide();
            $("#end1").hide();
        }else{ // joining a room
            username = localStorage.getItem('nick2')
            console.log("Joining " + localStorage.getItem('jRoom'));
            socket.emit('enterRoom', localStorage.getItem('jRoom'), localStorage.getItem('nick2'));
            chatRoom = localStorage.getItem('jRoom');
            $("#end").hide();
            $("#end1").hide(); 
        }
        $("#send").click(function (e) { 
            e.preventDefault();
            const msg = $("#msg").val();
            $("#msg").val("");
            document.getElementById('msg').focus();
            $("#send").hide();
            
            //console.log("My message to " + chatRoom + ": " + $("#msg").val());
            socket.emit('newMsg', msg, chatRoom);
            
        });
        socket.on('renderMsg', (text, name)=>{
            const time = moment().format("h:mm a");
            if (name==username) {
                $("#messages").append(`<div class="lighter"><p class="pt-2 pl-2">You:</p><p class="pl-2">${text}</p><span class="time-right pr-1">${time}</span><br></div><br>`);
            } else {
                $("#messages").append(`<div class="darker"><p class="pt-2 pl-2">${name}:</p><p class="pl-2">${text}</p><span class="time-right pr-1">${time}</span><br></div><br>`);
            }
            let div = $("#messages");
            div.scrollTop(div.prop('scrollHeight'));
        });
        $("#loc").click(function (e) { 
            console.log('click');
            e.preventDefault();
            if(navigator.geolocation){
                navigator.geolocation.getCurrentPosition((position)=>{
                    fetch('/try',{
                        method: 'POST',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({lat: position.coords.latitude, long: position.coords.longitude})
                    }).then((response)=>{
                        response.json().then((data)=>{
                            console.log(data);
                            let lat = position.coords.latitude;
                            let long = position.coords.longitude;
                            let obj = {
                                location: data.features[0].place_name,
                                link: `https://google.com/maps?q=${lat},${long}`
                            };
                            console.log(`${moment().format("h:mma")}`)
                            console.log(`${obj.location}`);
                            console.log(`${obj.link}`);
                            socket.emit('location', obj, chatRoom, (status)=>{
                                
                                //$("#msg").append(`<p style="text-align: right">${moment().format("h:mma")}: ${obj.location}. <a href="${obj.link}">My current location</a></p>`);
                            });
                        })
                    });
                })
            }else{
                alert("Browser doesn't support geolocation");
            }
        });
        socket.on('shareLocation', (msg, nick)=>{
            const time = moment().format("h:mm a");
            if(nick==username){
                $("#messages").append(`<div class="lighter"><p class="pt-2 pl-2">You:</p><p class="pl-2">${msg.msg}. <a href=${msg.link}>Current Location</a></p><span class="time-right pr-1">${time}</span><br></div><br>`);
            }else{
                $("#messages").append(`<div class="darker"><p class="pt-2 pl-2">${nick}:</p><p class="pl-2">${msg.msg}. <a href=${msg.link}>Current Location</a></p><span class="time-right pr-1">${time}</span><br></div><br>`);
            }
            let div = $("#messages");
            div.scrollTop(div.prop('scrollHeight'));
        });
        socket.on('userList', (arr)=>{
            console.log("Participants List:", arr);
            $("#participants-list").html(`<p style="padding-left: 10px; padding-top: 10px;">&#x2022 ${username} (You)</p>`);
            $("#uList").html(`<li class="pb-2">${username} (You)</li>`);
            for (let index = 0; index < arr.length; index++) {
                if(arr[index].name==undefined || arr[index].name == username){
                }else{
                    $("#participants-list").append(`<p style="padding-left: 10px; padding-top: 10px;">&#x2022 ${arr[index].name}</p>`);
                    $("#uList").append(`<li class="pb-2">${arr[index].name}</li>`);
                }
            }
        });
        $("#end").click(function (e) { 
            e.preventDefault();
            socket.emit('endRoom', chatRoom);
        });
        $("#end1").click(function (e) { 
            e.preventDefault();
            socket.emit('endRoom', chatRoom);
        });
        
        socket.on('out', ()=>{
            location.href = '/';
        })
    }, 2000);
    
});