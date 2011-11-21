var app = require('express').createServer()
var io = require('socket.io').listen(app);

app.listen(2000);

// routing
app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

// usernames which are currently connected to the chat
var usernames = {};

var userRooms = {};

// rooms which are currently available in chat
var rooms = ['hackerschool','node.js','ruby','python','javascript'];

io.sockets.on('connection', function (socket) {
	
	// when the client emits 'adduser', this listens and executes
	socket.on('adduser', function(username){
		// store the username in the socket session for this client
		socket.username = username;
		// store the room name in the socket session for this client
		socket.room = rooms[0];
		// add the client's username to the global list
		usernames[username] = username;
		// add user room to global list
		userRooms[username] = socket.room;
		// send client to room 1
		socket.join(socket.room);
		// echo to client they've connected
		socket.emit('updatechat', 'spoken-node', 'you have connected to hackerschool');
	  // add room and user to room user list
		socket.broadcast.to(socket.room).emit('updateuserRoom', userRooms, socket.room);
		// echo to room 1 that a person has connected to their room
		socket.broadcast.to(socket.room).emit('updatechat', 'spoken-node', username + ' has connected to ' + socket.room);
		socket.emit('updaterooms', rooms, socket.room);
		socket.emit('updateuserRoom', userRooms, socket.room);
		
		// update the list of users in chat, client-side
    io.sockets.emit('updateusers', usernames);
	});
	
	// when the client emits 'sendchat', this listens and executes
	socket.on('sendchat', function (data) {
		// we tell the client to execute 'updatechat' with 2 parameters
		io.sockets.in(socket.room).emit('updatechat', socket.username, data);
	});
	
	socket.on('switchRoom', function(newroom){
		socket.leave(socket.room);
		socket.join(newroom);
		socket.emit('updatechat', 'spoken-node', 'you have connected to '+ newroom);
		// delete previous room
		//socket.emit('removeroom', socket.room)
		// sent message to OLD room
		socket.broadcast.to(socket.room).emit('updatechat', 'spoken-node', socket.username+' has left ' + socket.room);
		//socket.broadcast.to(socket.room).emit('updateuserRoom', userRooms, userRooms[socket.username]);
		
		// change user room and update users in old room
		userRooms[socket.username] = newroom;
		io.sockets.in(socket.room).emit('updateuserRoom', userRooms, socket.room);
		
		// update socket session room and update users in new room
		socket.room = newroom;
		io.sockets.in(newroom).emit('updateuserRoom', userRooms, newroom);
		
		// add room and user to room user list
		// socket.broadcast.to(newroom).emit('updateuserRoom', userRooms, socket.room);
		socket.broadcast.to(newroom).emit('updatechat', 'spoken-node', socket.username+ ' has joined ' + newroom);
		socket.emit('updaterooms', rooms, newroom);
		// update the list of users in chat, client-side
		//socket.emit('updateuserRoom', socket.username, newroom);
		
	});
	

	// when the user disconnects.. perform this
	socket.on('disconnect', function(){
		// remove the username from global usernames list
		delete usernames[socket.username];
		// update list of users in chat, client-side
		io.sockets.emit('updateusers', usernames);
		// echo globally that this client has left
		socket.broadcast.emit('updatechat', 'spoken-node', socket.username + ' has disconnected');
		socket.leave(socket.room);
	});
});