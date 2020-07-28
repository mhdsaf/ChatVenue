$(document).ready(function () {
    $("#copy").hide();
    $('[data-toggle="tooltip"]').tooltip();
    $("#clip").click(function (e) { 
        e.preventDefault();
    });
    new ClipboardJS('.clip');
    localStorage.setItem('jRoom', '');
    localStorage.setItem('check', '');
    const urlParams = new URLSearchParams(window.location.search);
    const n = urlParams.get('n');
    const p = urlParams.get('p');
    const socket = io();
    if(n!=null && p!=null){
        socket.emit('join', n, p);
    }
    $("#grpBtn").click(function (e) {
        e.preventDefault();
        if ($("#name1").val()=='' || $("#password1").val()=='' || $("#nick1").val()=='') {
            $("#msg").html( `<div class="alert alert-danger"><strong>Error:</strong> Empty field(s)</div>` );
            $("#copy").hide();
            $("#msg").show();
        } else {
            $("#msg").html('');
            localStorage.setItem('room', $("#name1").val());
            localStorage.setItem('pass', $("#password1").val());
            localStorage.setItem('nick1', $("#nick1").val());
            localStorage.setItem('check', '');
            localStorage.setItem('jRoom', '')
            socket.emit('getURL', $("#name1").val(), $("#password1").val());
        }
    });
    socket.on('URL', (name, password, status)=>{ // server sending access URL
        //$("#msg").html(`<div>localhost:3000?n=${name}&p=${password}</div>`);
        //alert(`localhost:3000?n=${name}&p=${password}`);
        if (status==true) {
            $("#foo").val(`https://chatvenue.herokuapp.com?n=${name}&p=${password}`);
            localStorage.setItem('URL', `https://chatvenue.herokuapp.com?n=${name}&p=${password}`)
            $("#msg").hide();
            $("#copy").show();
            //location.href = '/chat';
        } else {
            $("#msg").html( `<div class="alert alert-danger"><strong>Error:</strong> There is an on-going char room with the same name. Please choose another name</div>` );
            $("#copy").hide();

            $("msg").show();
        }
    });
    socket.on('roomName', (room)=>{ // redirecting user to room (entered a valid URL()
        $("#rm").html(room);
        localStorage.setItem('jRoom', room);
        localStorage.setItem('check', '');
        document.getElementById('mod').click();
    });
    $("#link").click(function (e) { 
        e.preventDefault();
        if($("#nick22").val()==''){
            $("#err1").html( `<div class="alert alert-danger"><strong>Error:</strong> Empty field</div>` );
        }else{
            localStorage.setItem('nick2', $('#nick22').val());
            location.href = '/chat';
        }
    });
    $("#accessBtn").click(function (e) {
        e.preventDefault();
        //console.log('click')
        if ($("#name3").val()=='' || $("#password3").val()=='' || $("#nick3").val()=='') {
            //alert('empty fields');
            $("#msg3").html( `<div class="alert alert-danger"><strong>Error:</strong> Empty field(s)</div>` );
        } else {
            //alert('okay')
            $("#msg3").html('');
            socket.emit('checkRoom', $("#name3").val(), $("#password3").val(), (status)=>{
                if(status=='found'){
                    //alert('found room')
                    localStorage.setItem('check', $("#name3").val());
                    localStorage.setItem('jRoom', '');
                    localStorage.setItem('room', $("#name3").val());
                    localStorage.setItem('pass', $("#password3").val());
                    localStorage.setItem('nick3', $("#nick3").val())
                    location.href = '/chat';
                }else{
                    //alert('Room not found');
                    $("#msg3").html( `<div class="alert alert-danger"><strong>Room not found:</strong> Invalid credentials</div>` );
                }
            });
        }
    });
});