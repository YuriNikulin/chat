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

socket.on('server_error', function(data) {
	showErrorPopup(data);
})

socket.on('fetch_user_id', function(userId) {
	document.cookie = 'chatUserId=' + userId;
	currentUser.id = userId;
})

socket.on('server_sends_invitation', function(initiator, namespace) {
	debugger;
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
	});

	acceptButton.addEventListener('click', function() {
		closeNotification(notificationContainer);
		socket.emit('user_accepted_server_invitation', namespace);
	});

})

socket.on('server_directs_to_namespace', function(data) {
	document.cookie = 'chatRoomId=' + data;
	window.location.replace('/chatroom');

})

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

window.addEventListener('load', function() {
	requestUserId();
	authorization();
	usersOnlineMonitoring();
	selectboxes();
	usersInvitation();
	rooms();
})