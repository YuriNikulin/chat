var io = require('socket.io'),
	userId = 0,
	clients = [],
	clientsToFetch = [],
	rooms = {},
	newUserData;

function newUser(id, username) {
	this.id = id;
	this.username = username ? username : 'anonymous';
}

function newUserToFetch(user) {
	var newUserToFetch = new newUser(user.id, user.username);
	return JSON.stringify(newUserToFetch);
}

exports.initialize = function(server) {
	io = io.listen(server);
	io.sockets.on('connection', function(socket) {
		// socket.on('message', function(message) {
		// 	message = JSON.parse(message);
		// 	message.author = socket.username;
		// 	if (message.type == "userMessage") {
		// 		socket.broadcast.send(JSON.stringify(message));
		// 		message.type = "myMessage";
		// 		socket.send(JSON.stringify(message));
		// 	}
		// });

		socket.on('disconnect', function() {
			console.log('disconnected!');
			socket.broadcast.emit('user_disconnected', newUserToFetch(socket));
		})

		socket.on('request_user_id', function() {
			socket.emit('fetch_user_id', socket.id);
		})

		socket.on('request_list_of_users', function() {
			var usersToFetch = {};
			for (var i in io.sockets.sockets) {
				usersToFetch[i] = new newUser(io.sockets.sockets[i].id, io.sockets.sockets[i].username);
			}
			socket.emit('fetch_list_of_users', JSON.stringify(usersToFetch));
		})

		socket.on('user_sends_nickname', function(username) {
			username ? (socket.username = username) : (socket.username = 'anonymous');
			socket.broadcast.emit('user_disconnected', newUserToFetch(socket));
			socket.broadcast.emit('new_user_connected', newUserToFetch(socket));
		})

		socket.on('set_name', function(data) {
			socket.username = data.name;
			socket.emit('name_set', data);
		})
	});
};