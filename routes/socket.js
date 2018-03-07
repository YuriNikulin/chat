var io = require('socket.io'),
	userId = 0,
	clients = [],
	clientsToFetch = [],
	rooms = {},
	message = {},
	namespaces = [],
	newUserData;

function newUser(id, username) {
	this.id = id;
	this.username = username ? username : 'anonymous';
}

function newUserToFetch(user) {
	var newUserToFetch = new newUser(user.id, user.username);
	return JSON.stringify(newUserToFetch);
}

function newRoom(id, name, initiator, currentUsers, maxUsers, security) {
	this.id = id;
	this.name = name;
	this.currentUsers = currentUsers;
	this.maxUsers = maxUsers;
	this.security = security;
}

function newRoomToFetch(room) {
	var newRoomToFetch = new newRoom(room.name, room.roomName, room.roomInitiator.username, Object.keys(room.sockets).length, room.roomMaxUsersCount, room.roomSecurity);
	return JSON.stringify(newRoomToFetch);
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

		socket.on('user_requests_list_of_rooms', function() {
			var rooms = io.nsps;
			for (var i in rooms) {
				if (rooms[i].name == '/') {
					continue;
				}
				socket.emit('server_fetches_room', newRoomToFetch(rooms[i]));
			}
		})

		socket.on('user_sends_nickname', function(username) {
			username ? (socket.username = username) : (socket.username = 'anonymous');
			socket.broadcast.emit('user_disconnected', newUserToFetch(socket));
			socket.broadcast.emit('new_user_connected', newUserToFetch(socket));
		})

		socket.on('user_sends_invitation', function(users, initiator, namespace) {
			var invitedUsersCounter = 0,
				invitedUsersMsg;
			if (!users || !namespace || !io.nsps['/' + namespace]) {
				return 0;
			}

			for (var i in users) {
				if (io.sockets.sockets[i] && Object.keys(io.nsps['/' + namespace].sockets).length < io.nsps['/' + namespace].roomMaxUsersCount) {
					invitedUsersCounter++;
					io.sockets.sockets[i].emit('server_sends_invitation', initiator, namespace);
				}
			}
			if (invitedUsersCounter == 1) {
				invitedUsersMsg = '1 user has been invited';
			}   else if (invitedUsersCounter > 1) {
				invitedUsersMsg = invitedUsersCounter + ' users have been invited';
			}   else {
				invitedUsersMsg = 'No users have been invited';
			}

			socket.emit('users_have_been_invited', invitedUsersMsg);
		})

		socket.on('set_name', function(data) {
			socket.username = data.name;
			socket.emit('name_set', data);
		})

		socket.on('user_accepted_server_invitation', function(namespace) {
			if (Object.keys(io.nsps['/' + namespace].sockets).length < io.nsps['/' + namespace].roomMaxUsersCount) {
				socket.emit('server_directs_to_namespace', namespace);
			}   else {
				socket.emit('server_error', 'The room is full');
			}

		})

		socket.on('user_creates_room', function(data) {
			var newNamespaceName,
				newNamespace,
				invitedUsers;	

			newNamespaceName = data.roomInitiator.id + '_'  + data.roomName.match(/\S/g).join("");
			newNamespace = io.of('/' + newNamespaceName);
			newNamespace.roomInitiator = data.roomInitiator;
			newNamespace.roomName = data.roomName;
			newNamespace.roomMaxUsersCount = data.roomMaxUsersCount;
			newNamespace.roomSecurity = data.roomSecurity;

			newNamespace.removeNamespace = function() {
				for (var i in this.sockets) {
					this.sockets[i].disconnect();
				}
				this.removeAllListeners();
				delete io.nsps[this.name];
			}

			socket.emit('server_directs_to_namespace', newNamespaceName);

			invitedUsers = data.roomInvitedUsers;

			if (invitedUsers) {
				for (var i in invitedUsers) {
					if (io.sockets.sockets[i]) {
						io.sockets.sockets[i].emit('server_sends_invitation', data.roomInitiator.username, newNamespaceName);
					}
				}
			}

			newNamespace.on('connection', function(socket) {

				socket.emit('server_requests_username');

				socket.on('user_sends_username', function(username) {
					username ? (socket.username = username) : (socket.username = 'anonymous');
					newNamespace.send(JSON.stringify({	
						'message': socket.username + ' has been connected',
						'type': 'serverMessage'
					}));
				})

				socket.on('message', function(message) {
					message = JSON.parse(message);
					message.author = socket.username;
					console.log(message);
					if (message.type == "userMessage") {
						socket.broadcast.send(JSON.stringify(message));
						message.type = "myMessage";
						socket.send(JSON.stringify(message));
					}
				});

				socket.on('disconnect', function() {
					if (Object.keys(newNamespace.sockets).length < 1) {
						newNamespace.removeNamespace();
					}
					newNamespace.send(JSON.stringify({
						'message': socket.username + ' has left',
						'type': 'serverMessage'
					}));
				})

			})
		})
	});
};