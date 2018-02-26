var socket = io.connect();

var userNickname;
socket.on('debug_data', function(data) {
	console.log(data);
})

socket.on('name_set', function(data) {
	closePopup();
	authorization();
});

socket.on('fetch_user_id', function(userId) {
	document.cookie = 'chatUserId=' + userId;
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
			if (nicknameContainer[i].querySelector('span')) {
				nicknameContainer[i].removeChild(nicknameContainer[i].querySelector('span'));
			}
			nicknameSpan = document.createElement('span');
			nicknameContainer[i].appendChild(nicknameSpan);
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
	var usersContainer = document.querySelector('.users');

	socket.emit('request_list_of_users');

	socket.on('fetch_list_of_users', function(data) {
		
		for (var i in data) {
			appendUser(data[i], usersContainer);
		}
	})
}

function appendUser(user, container) {
	var userDiv = document.createElement('div');
		userSpan = document.createElement('span');
	container.appendChild(userDiv);
	userDiv.appendChild(userSpan);
	if (user.userId = getUserId()) {
		var thatsYouSpan = document.createElement('span');
		userSpan.appendChild(thatsYouSpan);
		thatsYouSpan.innerHTML = "(that's you)";
	}

	userDiv.id = 'user-' + user.userId;

	userSpan.innerHTML = user.username + ', ' + user.userId;	
}

window.addEventListener('load', function() {
	requestUserId();
	authorization();
	usersOnlineMonitoring();
})