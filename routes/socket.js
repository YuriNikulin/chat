var io = require('socket.io'),
	userId = 0,
	clients = [],
	clientsToFetch = [],
	rooms = {};

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
			// clients.splice(socket.userId, 1);
			
		})

		socket.on('request_user_id', function() {
			
			while (clients[userId]) {
				userId++;
			}
			socket.emit('fetch_user_id', userId);
			socket.userId = userId;
			clients[userId] = socket;
			socket.broadcast.emit('debug_data', 'userId: ' + socket.userId + ' userName: ' + socket.username);
		})

		socket.on('request_list_of_users', function() {
			clientsToFetch = [];
			var j = 0;
			for (var i = 0; i < clients.length; i++) {
				clientsToFetch[i] = {};
				clientsToFetch[i].username = clients[i].username;
				clientsToFetch[i].userId = clients[i].userId;
			}
			socket.emit('fetch_list_of_users', clientsToFetch);
		})

		socket.on('user_sends_nickname', function(username) {
			socket.username = username;
			clients[socket.userId].username = username;
		})

		socket.on('set_name', function(data) {
			socket.username = data.name;
			clients[socket.userId].username = data.name;
			socket.emit('name_set', data);
		})
	});
};