var animDuration = 300,
	body = document.querySelector('body');

// var selectboxChangeEvent = document.createEvent('Event');
// 	selectboxChangeEvent.initEvent('selectboxChange', true, true);

var selectboxChangeEvent = new CustomEvent('selectboxChange');

function chatSizeCalculate() {
	var clientHeight,
		chat = document.querySelector('.s-chat .s-chat-messages'),
		input = document.querySelector('.s-chat .s-chat-input-container');

	function calc() {
		clientHeight = window.innerHeight;
		chat.style.minHeight = clientHeight - input.getBoundingClientRect().height + 'px';
		chat.style.paddingBottom = input.getBoundingClientRect().height + 'px';
	}

	calc();

	window.addEventListener('resize', calc);
}

function popups() {
	var openers = document.querySelectorAll('.popup-opener'),
		popup;
	for (var i = 0; i < openers.length; i++) {
		openers[i].addEventListener('click', function() {
			popup = this.parentNode.querySelector('.popup');
			showPopup(popup);
		})
	}
}

function toggleElem(elem) {
	if (!elem) {
		return 0;
	}

	if (elem.classList.contains('shown')) {
		elem.classList.remove('shown');
		setTimeout(function() {
			elem.style.display = 'none';
		}, animDuration);
	} else {
		elem.style.display = 'block';
		setTimeout(function() {
			elem.classList.add('shown');
		}, 10);
	}
}

function getUserNickname() {
	var userNickname = document.cookie.match( /chatUserNickname=([^;]+)/);

	if (userNickname) {
		userNickname = userNickname[1];
	}  else {
		userNickname = null;
	}
	return userNickname;
}

function getUserId() {
	var userId = document.cookie.match( /chatUserId=([^;]+)/);
	if (userId) {
		userId = userId[1];
	}   else {
		userId = null;
	}

	return userId;
}

function getRoomId() {
	var RoomId = document.cookie.match( /chatRoomId=([^;]+)/);
	if (RoomId) {
		RoomId = RoomId[1];
	}   else {
		RoomId = null;
	}

	return RoomId;
}

function appendOverlay(overlayClassList) {
	var overlay = document.createElement('div');
	overlay.classList.add(overlayClassList, 'overlay');
	body.appendChild(overlay);
	overlay.classList.add('shown');
	return overlay;
}

function leadingZero(number) {
	if (number < 10) {
		return '0' + number;
	}

	return number;
}

function getWindowWidth() {
	return window.outerWidth;
}

function getWindowHeight() {
	return window.outerHeight;
}

function submitOnEnter(elem, functionToInvoke) {
	elem.addEventListener('keydown', function(event) {
		if (event.key == "Enter" || event.keyCode == 13) {
			functionToInvoke();
		}
	})
}

function removeOverlay() {
	var overlay = document.querySelector('body > .overlay');
	overlay.classList.remove('shown');
	setTimeout(function() {
		body.removeChild(overlay);
	}, 300);
}

function selectboxes() {
	var selectboxes = document.querySelectorAll('.selectbox');
	
	
	for (var i = 0; i < selectboxes.length; i++) {
		
		var selectbox = selectboxes[i];
			selectbox.selectboxTitle = selectbox.querySelector('.selectbox__title'),
			selectbox.container = selectbox.querySelector('.selectbox-container'),
			selectbox.items = selectbox.querySelectorAll('.selectbox__item');
			selectbox.items.selectboxParent = selectbox.selectboxTitle.selectboxParent = selectbox;

		for (var j = 0; j < selectbox.items.length; j++) {
			var selectboxItem = selectbox.items[j];
			selectboxItem.selectboxParent = selectbox;
			selectboxItem.onclick = function() {
				selectItemSelectbox(this);
			}
		}

		selectbox.selectboxTitle.onclick = function(event) {
			self = this;

			if (this.dataset.triggered == 'false') {
				showSelectbox(this.selectboxParent);
				event.stopPropagation();
			}

			body.onclick = function(event) {
				if (!event.target.classList.contains('selectbox__item') || event.target.classList.contains('selectbox__title')) {
					closeSelectbox(self.selectboxParent);
				}
			}
		}
	}
}

function selectItemSelectbox(item) {
	var parent = item.selectboxParent;
	parent.selectboxTitle.dataset.value = item.dataset.value;
	parent.selectboxTitle.innerHTML = item.innerHTML;
	parent.querySelector('.active').classList.remove('active');
	item.classList.add('active');
	closeSelectbox(parent);
	parent.dispatchEvent(selectboxChangeEvent);

}

function removeInputErrors(container) {
	var errors = container.querySelectorAll('.input__error');
	for (var i = 0; i < errors.length; i++) {
		errors[i].parentNode.removeChild(errors[i]);
	}
}

function showInputError(elem, warning) {
	if (!elem) {
		return 0;
	}

	if (!warning) {
		warning = 'This field has not been filled correctly';
	}

	var warningSpan = document.createElement('span');
	warningSpan.classList.add('input__error');
	elem = elem.parentNode;
	elem.appendChild(warningSpan);
	warningSpan.innerHTML = warning;

}

function showPopup(popup) {
	if (!popup) {
		return 0;
	}
	popup.style.display = 'block';
	popup.classList.add('shown');
	var overlay = appendOverlay('popup-overlay');
	if (popup.querySelector('.focus')) {
		popup.querySelector('.focus').focus();
	}
	overlay.addEventListener('click', function() {
		closePopup(popup);
	})

}

function showSelectbox(selectbox) {
	selectbox.classList.add('shown');
	selectbox.selectboxTitle.dataset.triggered = 'true';
}

function closeSelectbox(selectbox) {
	selectbox.classList.remove('shown');
	selectbox.selectboxTitle.dataset.triggered = 'false';
}

function showNotification(content) {
	var notificationContainer = document.createElement('div');
	body.appendChild(notificationContainer);
	notificationContainer.classList.add('notification');
	notificationContainer.appendChild(content);
	setTimeout(function() {
		notificationContainer.classList.add('shown');
	}, 100)

	return notificationContainer;
}

function closeNotification(elem) {
	elem.classList.remove('shown');
	setTimeout(function() {
		elem.parentNode.removeChild(elem);
	}, 300);
}

function closePopup(popup) {
	if (!popup) {
		popup = document.querySelector('.popup.shown');
		if (!popup) {
			return 0;
		}
	}

	popup.classList.remove('shown');
	removeOverlay();
	setTimeout(function() {
		popup.style.display = '';
	}, 300);
}

function inviteUsers(users, initiator) {
	if (!users) {
		return 0;
	}

	socket.emit('user_sends_invitation', users, initiator);
}


function appendUser(user, container) {
	var userContainer = document.createElement('div');
		userDiv = document.createElement('div'),
		userSpan = document.createElement('span');
	container.appendChild(userContainer);
	userContainer.appendChild(userDiv);
	userContainer.dataset.userid = user.id;
	userContainer.classList.add('users-user');
	userDiv.appendChild(userSpan);
	userSpan.classList.add('username');
	userSpan.innerHTML = user.username;
	if (user.id == getUserId()) {
		var thatsYouSpan = document.createElement('span');
		userDiv.appendChild(thatsYouSpan);
		thatsYouSpan.innerHTML = "(that's you)";
		thatsYouSpan.classList.add('users__self')
		userContainer.classList.add('users-user--self');
	}
}

function removeUser(user) {
	var elements = document.querySelectorAll('[data-userid="' + user.id + '"]');
	for (var i = 0; i < elements.length; i++) {
		elements[i].parentNode.removeChild(elements[i]);
	}
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

function requestUserId() {
	socket.emit('request_user_id');
}

function authorization() {
	var nicknameContainer = document.querySelectorAll('.user-nickname'),
		nicknameSpan;	
	userNickname = currentUser.username = getUserNickname();

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

		if (authInput) {
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

	socket.on('user_disconnected', function(data) {
		data = JSON.parse(data);
		if (selectedUsers[data.id]) {
			delete selectedUsers[data.id];
			updateInviteButton();
		}
	})

	invite.addEventListener('click', function() {
		if (!this.classList.contains('btn--disabled')) {
			showPopup(nrPopup);

			if (typeof(nr) == 'function') {
				nr(selectedUsers);
			}  else {
				socket.emit('user_sends_invitation', selectedUsers, currentUser.username, getRoomId());
			}
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
	popups();
})