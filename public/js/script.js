var animDuration = 300,
	body = document.querySelector('body');

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
		userUd = null;
	}

	return userId;
}

function appendOverlay(overlayClassList) {
	var overlay = document.createElement('div');
	overlay.classList.add(overlayClassList, 'overlay');
	body.appendChild(overlay);
	overlay.classList.add('shown');
}

function leadingZero(number) {
	if (number < 10) {
		return '0' + number;
	}

	return number;
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

function showPopup(popup) {
	popup.style.display = 'block';
	popup.classList.add('shown');
	appendOverlay('popup-overlay');
	if (popup.querySelector('.focus')) {
		popup.querySelector('.focus').focus();
	}
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

window.addEventListener('load', function() {
	popups();
})