var io = require('socket.io');

exports.initialize = function(server) {
	io = io.listen(server);
	var firstChannel = io.of("/first_channel").on("connection", function(socket) {
		socket.on('message', function() {
			console.log("ON PRISLAL PO PERVOMU KANALU!");
			socket.send('You have triggered the first channel!');
		})
	})

	var secondChannel = io.of("/second_channel").on("connection", function(socket) {
		socket.on('message', function() {
			console.log("ON PRISLAL PO VTOROMU KANALU!");
			socket.send('You have triggered the second channel!');
		})
	})
	io.sockets.on('connection', function(socket) {
		socket.on('message', function(message) {
			message = JSON.parse(message);
			message.author = socket.username;
			if (message.type == "userMessage") {
				socket.broadcast.send(JSON.stringify(message));
				message.type = "myMessage";
				socket.send(JSON.stringify(message));
			}
		});

		socket.on('set_name', function(data) {
			socket.username = data.name;
			socket.emit('name_set', data);
			socket.broadcast.send(JSON.stringify({
				type: 'serverMessage',
				message: '<em>' + data.name + '</em>' + ' has been connected'
			}))
		})
	});
};