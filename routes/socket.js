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
	this.initiator = initiator;
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
			if (!users || !namespace || !io.nsps[namespace]) {
				return 0;
			}

			for (var i in users) {
				if (io.sockets.sockets[i] && Object.keys(io.nsps[namespace].sockets).length < io.nsps[namespace].roomMaxUsersCount) {
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

			if (!namespace || !io.nsps[namespace]) {
				return 0;
			}
			if (Object.keys(io.nsps[namespace].sockets).length < io.nsps[namespace].roomMaxUsersCount) {
				socket.emit('server_directs_to_namespace', namespace);
			}   else {
				socket.emit('server_error', 'The room is full');
			}

		})

		socket.on('user_wants_join_room', function(room) {
			var namespace = io.nsps[room],
				initiator;
			if (!namespace || !namespace.sockets) {
				return 0;
			}

			if (Object.keys(namespace.sockets).length >= namespace.roomMaxUsersCount) {
				socket.emit('server_error', 'The room is full');
				return 0;
			}

			if (namespace.sockets[namespace.roomInitiator.id]) {
				initiator = namespace.sockets[namespace.roomInitiator.id]
			}  else {
				for (var j in namespace.sockets) {
					initiator = namespace.sockets[j];
					break;
				}

				if (!initiator) {
					return 0;
				}
			}

			socket.emit('server_sends_notification', 'Your request has been sent');

			initiator.emit('user_wants_join_room', socket.username, socket.id);
		})

		socket.on('user_accepted_user_request', function(id, namespace) {
			if (io.sockets.sockets[id] && io.nsps[namespace] && Object.keys(io.nsps[namespace].sockets).length < io.nsps[namespace].roomMaxUsersCount) {
				io.sockets.sockets[id].emit('server_directs_to_namespace', namespace);
			}
		})

		socket.on('user_creates_room', function(data) {
			var newNamespaceName,
				newNamespace,
				invitedUsers;

			newNamespaceName = '/' + data.roomInitiator.id + '_'  + data.roomName.match(/[^,\s]/g).join("");
			newNamespace = io.of(newNamespaceName);
			newNamespace.roomInitiator = data.roomInitiator;
			newNamespace.roomName = data.roomName;
			newNamespace.roomMaxUsersCount = data.roomMaxUsersCount;
			newNamespace.roomSecurity = data.roomSecurity;

			newNamespace.removeNamespace = function() {
				socket.broadcast.emit('room_has_been_deleted', newRoomToFetch(this));
				for (var i in this.sockets) {
					this.sockets[i].disconnect();
				}
				this.removeAllListeners();
				delete io.nsps[this.name];
			}

			socket.emit('server_directs_to_namespace', newNamespaceName);
			socket.broadcast.emit('server_fetches_room', newRoomToFetch(newNamespace));

			invitedUsers = data.roomInvitedUsers;

			if (invitedUsers) {
				for (var i in invitedUsers) {
					if (io.sockets.sockets[i]) {
						io.sockets.sockets[i].emit('server_sends_invitation', data.roomInitiator.username, newNamespaceName);
					}
				}
			}

			newNamespace.on('connection', function(socket) {
				if (newNamespace.removeTimer) {
					clearTimeout(newNamespace.removeTimer);
				}

				socket.emit('server_requests_username');
				socket.emit('server_sends_wid', socket.id);

				io.of('/').emit('room_has_been_updated', newNamespace.name, 'currentUsers', Object.keys(newNamespace.sockets).length + '/' + newNamespace.roomMaxUsersCount);

				socket.on('initiator_check', function(data) {
					if (data == newNamespace.roomInitiator.id) {
						newNamespace.roomInitiator.id = socket.id;
					}
				})

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
						newNamespace.removeTimer = setTimeout(function() {
							newNamespace.removeNamespace();
						}, 10000);
					}
					newNamespace.send(JSON.stringify({
						'message': socket.username + ' has left',
						'type': 'serverMessage'
					}));
					newNamespace.emit('w_user_disconnected', socket.id);

					io.of('/').emit('room_has_been_updated', newNamespace.name, 'currentUsers', Object.keys(newNamespace.sockets).length + '/' + newNamespace.roomMaxUsersCount);
				});

				socket.on('w_user_requests_list_of_users', function(socket) {
					var socket = newNamespace.sockets[socket];
					var users = [];
					for (var i in newNamespace.sockets) {
						users.push(newUserToFetch(newNamespace.sockets[i]));
					}
					if (socket) {
						socket.emit('w_server_fetches_list_of_users', users);
					}
				})

				socket.on('webrtcMsg', function(data) {
					if (newNamespace.sockets[data.to]) {
						newNamespace.sockets[data.to].emit('webrtcMsg', {
							'from': data.from,
							'msg': data.msg
						});
					}
				})

			})
		})
	});
};