var socket = io.connect();

var userNickname,
	currentUser = {};
socket.on('debug_data', function(data) {
	console.log(data);
})

socket.on('name_set', function(data) {
	closePopup();
	authorization();

	currentUser.username = data.name;
	removeUser(currentUser);
	appendUser(currentUser, document.querySelector('.users'));
});

socket.on('fetch_user_id', function(userId) {
	document.cookie = 'chatUserId=' + userId;
	currentUser.id = userId;
})

function requestUserId() {
	socket.emit('request_user_id');
}

function authorization() {
	var nicknameContainer = document.querySelectorAll('.user-nickname'),
		nicknameSpan;	
	userNickname = getUserNickname();

	socket.emit('user_sends_nickname', userNickname);
	if (!userNickname) {
		userNickname = 'anonymous user';
	}

	if (nicknameContainer) {
		for (var i = 0; i < nicknameContainer.length; i++) {
			var username = nicknameContainer[i].querySelector('.username');

			if (username) {
				username.parentNode.removeChild(nicknameContainer[i].querySelector('.username'));
			}
			nicknameSpan = document.createElement('span');
			nicknameContainer[i].appendChild(nicknameSpan);
			nicknameSpan.classList.add('username');
			nicknameSpan.innerHTML = userNickname;
		}
	}

	var authSubmit = document.querySelector('#auth-submit'),
		authInput = document.querySelector('#auth-name');

		authInput.focus();	
		authSubmit.addEventListener('click', function() {
			socket.emit("set_name", {name: authInput.value});
			document.cookie = 'chatUserNickname=' + authInput.value;
		});
		submitOnEnter(authInput, function() {
			socket.emit("set_name", {name: authInput.value});
			document.cookie = 'chatUserNickname=' + authInput.value;
		})
}

function usersOnlineMonitoring() {
	var usersContainer = document.querySelector('.users'),
		usersList;

	socket.emit('request_list_of_users');

	socket.on('fetch_list_of_users', function(data) {
		usersList = JSON.parse(data);
		for (var i in usersList) {
			appendUser(usersList[i], usersContainer);
		}
	});

	socket.on('new_user_connected', function(data) {
		var user = JSON.parse(data);
		appendUser(user, usersContainer);
	})

	socket.on('user_disconnected', function(data) {
		var user = JSON.parse(data);
		removeUser(user);
	});
}

window.addEventListener('load', function() {
	requestUserId();
	authorization();
	usersOnlineMonitoring();
})