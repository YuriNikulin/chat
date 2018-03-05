var socket = io.connect();

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

socket.on('server_sends_invitation', function(initiator) {
	var invitationContainer = document.createElement('div'),
		acceptButton = document.createElement('a'),
		declineButton = document.createElement('a'),
		invitationText = document.createElement('span'),
		invitationInitiator = document.createElement('span');

	invitationContainer.appendChild(invitationText);
	invitationContainer.appendChild(acceptButton);
	invitationContainer.appendChild(declineButton);

	acceptButton.innerHTML = 'Accept';
	acceptButton.className = 'btn btn--primary';
	declineButton.className = 'btn btn--secondary fl--r';
	declineButton.innerHTML = 'Decline';
	invitationText.innerHTML = ' is inviting you to join a room';
	invitationText.className = 'invitation__text notification__text mb--reg';
	
	invitationInitiator.innerHTML = initiator;
	invitationInitiator.classList.add('notification__span');
	invitationText.insertBefore(invitationInitiator, invitationText.childNodes[0]);
	var notificationContainer = showNotification(invitationContainer);
	declineButton.addEventListener('click', function() {
		closeNotification(notificationContainer);
	})
})

socket.on('server_directs_to_namespace', function(data) {
	document.cookie = 'chatRoomId=' + data;
	window.location.replace('/chatroom');

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

function nr(invitedUsers) {
	var nrContainer = document.querySelector('.nr'),
		nrName = nrContainer.querySelector('#room-name'),
		nrUsersCount = nrContainer.querySelector('#room-users-count'),
		nrSecurity = nrContainer.querySelector('#room-security .selectbox__title'),
		nrCreate = nrContainer.querySelector('.nr__create'),
		nrInitiator,
		nrBuffer,
		newRoomDescription = {},
		nrRegExp,
		nrError;

		if (invitedUsers) {
			newRoomDescription.roomInvitedUsers = invitedUsers;
		}

		newRoomDescription.roomInitiator = currentUser;

		nrCreate.onclick = function() {
			removeInputErrors(nrContainer);
			nrDataCheck();
		}

	function nrDataCheck() {
		nrError = false;
		nrRegExp = (nrName.value).match(/\S/g);

		if (!nrRegExp) {
			nrError = true;
			showInputError(nrName, 'Room name can not be empty or consist of whitespaces only');
		} else {
			newRoomDescription.roomName = nrName.value;
		}

		nrBuffer = parseInt(nrUsersCount.value);

		if (!nrBuffer || nrBuffer > maxUsersCount) {
			nrError = true;
			showInputError(nrUsersCount, 'The value of this field should be integer value no more than ' + maxUsersCount);
		} else {
			newRoomDescription.roomMaxUsersCount = nrBuffer;
		}

		nrBuffer = nrSecurity.dataset.value;

		if (!nrBuffer) {
			nrError = true;
			showInputError(nrSecurity.parentNode);
		} else {
			newRoomDescription.roomSecurity = nrBuffer;
		}

		if (!nrError) {
			document.cookie = 'chatRoomName=' + newRoomDescription.roomName;
			socket.emit('user_creates_room', newRoomDescription);
			closePopup(nrContainer.parentNode);
		}

	}	
}

function usersInvitation() {
	var users = document.querySelectorAll('.users-user'),
		usersContainer = document.querySelector('.users'),
		invite = document.querySelector('.users__invite'),
		nrPopup = document.querySelector('.users__invite + .popup'),
		inviteCounter = invite.querySelector('.users__counter');
		selectedUsers = {};

	function selectUser(user) {
		user.classList.add('selected');
		selectedUsers[user.dataset.userid] = 1;
	}

	function unselectUser(user) {
		user.classList.remove('selected');
		delete selectedUsers[user.dataset.userid];
	}

	function updateInviteButton() {
		var counter = Object.keys(selectedUsers).length;
		inviteCounter.innerHTML = '(' + counter + ')';

		if (counter > 0) {
			invite.classList.remove('btn--disabled');
		}  else {
			invite.classList.add('btn--disabled');
		}
	}

	invite.addEventListener('click', function() {
		if (!this.classList.contains('btn--disabled')) {
			showPopup(nrPopup);
			nr(selectedUsers);
		}
	});

	usersContainer.addEventListener('click', function(event) {

		var clickedUser = event.target,
			clickedUserParent = clickedUser.parentNode;
		if (!clickedUser.classList.contains('users-user')) {
			while (!clickedUserParent.classList.contains('users-user') && clickedUserParent != document) {
				clickedUser = clickedUserParent;
				clickedUserParent = clickedUser.parentNode;
			}

			if (clickedUserParent.classList.contains('users-user')) {
				clickedUser = clickedUserParent;
			} else {
				return 0;
			}
		}

		if (clickedUser.classList.contains('users-user--self')) {
			return 0;
		}

		if (!clickedUser.classList.contains('selected')) {
			selectUser(clickedUser);
		}  else {
			unselectUser(clickedUser);
		}
		updateInviteButton();
	})
}

window.addEventListener('load', function() {
	requestUserId();
	authorization();
	usersOnlineMonitoring();
	selectboxes();
	usersInvitation();
})