
var namespace = io(getRoomId());

namespace.emit('initiator_check', getUserId());

var socket = io.connect();

var chatClosed = false,
	usersClosed = false;

var msgUnreadCounter = 80;

namespace.on('server_requests_username', function() {
	userName = getUserNickname();
	namespace.emit('user_sends_username', userName);
})

namespace.on('server_sends_wid', function(data) {
	document.cookie = 'chatUserWid=' + data;
	currentUser.wid = data;
})

namespace.on('user_wants_join_room', function(name, id) {
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
	invitationText.innerHTML = ' wants to join your room';
	invitationText.className = 'invitation__text notification__text mb--reg';
	
	invitationInitiator.innerHTML = name;
	invitationInitiator.classList.add('notification__span');
	invitationText.insertBefore(invitationInitiator, invitationText.childNodes[0]);
	var notificationContainer = showNotification(invitationContainer);
	declineButton.addEventListener('click', function() {
		closeNotification(notificationContainer);
	});

	acceptButton.addEventListener('click', function() {
		closeNotification(notificationContainer);
		socket.emit('user_accepted_user_request', id, namespace.nsp);
	});
})

socket.on('fetch_user_id', function(userId) {
	document.cookie = 'chatUserId=' + userId;
	currentUser.id = userId;
})

socket.on('users_have_been_invited', function(data) {
	var elem = document.createElement('p');
		elem.className = 'notification__text';	
		elem.innerHTML = data;
		showNotification(elem, 2500);
})

function crAccordion() {
	var container = document.querySelector('.cr-chat'),
		items = document.querySelectorAll('.cr-chat-item'),
		windowheight,
		contentSize;

	function calcContentSize() {
		windowHeight = getWindowHeight();
		contentSize = (windowHeight / items.length) - (((gutter * 2) / items.length) + document.querySelector('.cr-chat__title').offsetHeight);
		for (var i = 0; i < items.length; i++) {
			if (items[i].classList.contains('open')) {
				items[i].querySelector('.cr-chat-content').style.height = contentSize + 'px';
			}
		}
	}

	calcContentSize();

	window.addEventListener('resize', calcContentSize);

	for (var i = 0; i < items.length; i++) {
		items[i].querySelector('.cr-chat__title').onclick = function() {
			var parent = this.parentNode;
			if (parent.classList.contains('open')) {
				parent.classList.remove('open');
				parent.querySelector('.cr-chat-content').style.height = '';
			}  else {
				parent.classList.add('open');
				parent.querySelector('.cr-chat-content').style.height = contentSize + 'px';
			}
		}

		if (items[i].classList.contains('open')) {
			items[i].querySelector('.cr-chat-content').style.height = contentSize + 'px';
		}
	}
}

function crSettings() {
	var sContainer = document.querySelector('.cr-settings'),
		sItems = sContainer.querySelectorAll('.cr-settings__item'),
		sChat = sContainer.querySelector('.cr-settings__chat'),
		sUsers = sContainer.querySelector('.cr-settings__users'),
		crChat = document.querySelector('.cr-chat-chat'),
		crUsers = document.querySelector('.cr-chat-users');

	for (var i = 0; i < sItems.length; i++) {
		sItems[i].addEventListener('click', function() {
			this.classList.toggle('selected');
		})
	}

	sChat.addEventListener('click', function() {
		toggleElem(crChat);
		chatClosed ? chatClosed = false : chatClosed = true;
		crIsChatClosed();
	})

	sUsers.addEventListener('click', function() {
		toggleElem(crUsers);
		usersClosed ? usersClosed = false : usersClosed = true;
		crIsChatClosed();
	})
}

function crIsChatClosed() {
	var container = document.querySelector('.cr-video');
	if (chatClosed && usersClosed) {
		container.classList.add('cr-video--no-chat')
	} else {
		container.classList.remove('cr-video--no-chat');
	}
}

function crChat() {
	var container = document.querySelector('.cr-chat'),
		chat = container.querySelector('.chat'),
		chatTitle = container.querySelector('.cr-chat-chat .cr-chat__title'),
		input = container.querySelector('.chat-field__input'),
		send = container.querySelector('.chat-field__send'),
		messageData = {},
		messageText;

		send.addEventListener('click', sendMessageToServer);
		submitOnEnter(input, sendMessageToServer);

	chatTitle.addEventListener('click', function() {
		msgUnreadCounter = 0;
		if (chatTitle.querySelector('.cr-chat-chat__unread')) {
			chatTitle.removeChild(chatTitle.querySelector('.cr-chat-chat__unread'));
		}
	})	

	function sendMessageToServer() {
		messageText = input.value;

		if (!messageText) {
			return 0;
		}

		input.value = '';
		messageData.message = messageText;
		messageData.type = 'userMessage';
		namespace.send(JSON.stringify(messageData));
		input.focus();
	}

	namespace.on('message', function(data) {
		data = JSON.parse(data);
		var toShowDate,
			toShowAuthor,
			chatContainer = document.querySelector('.chat'),
			chatScrollContainer = document.querySelector('.chat-container'),
			msgContainer = document.createElement('div'),
			msgClass,
			msgText = document.createElement('p');

		msgContainer.className = ('chat-msg chat-msg--') + data.type;

		toShowDate = toShowAuthor = (data.type != 'serverMessage');

		if (toShowAuthor) {
			var msgAuthor = document.createElement('span');
			msgAuthor.classList.add('chat-msg__author');
			msgAuthor.innerHTML = data.author;
			msgContainer.appendChild(msgAuthor);
		} 	

		if (toShowDate) {
			var formattedDate;
			var msgDate = document.createElement('span');
			msgDate.classList.add('chat-msg__date');
			formattedDate = new Date();
			formattedDate = leadingZero((formattedDate.getHours())).toString() + ':' + leadingZero(formattedDate.getMinutes());
			msgDate.innerHTML = formattedDate;
			msgContainer.appendChild(msgDate);
		}

		if (data.type == 'userMessage' && !document.querySelector('.cr-chat-chat').classList.contains('open')) {
			msgUnreadCounter++;
			var unreadSpan = document.createElement('span'),
				container = document.querySelector('.cr-chat-chat .cr-chat__title'),
				oldCounter = container.querySelector('.cr-chat-chat__unread');

			if (oldCounter) {
				oldCounter.parentNode.removeChild(oldCounter);
			}	

			container.appendChild(unreadSpan);
			unreadSpan.className = 'cr-chat-chat__unread';
			unreadSpan.innerHTML = '(' + (msgUnreadCounter < 100 ? msgUnreadCounter : '99+') + ')';
		}
		msgText.innerHTML = data.message;
		msgContainer.appendChild(msgText);
		chatContainer.appendChild(msgContainer);
		chatScrollContainer.scrollTop = chatContainer.scrollHeight;
	})
}

window.addEventListener('load', function() {
	if (!namespace) {
		var errorPopup = document.createElement('div'),
			errorText = document.createElement('p'),
			errorButton = document.createElement('a');
		body.appendChild(errorPopup);
		errorPopup.className = 'popup tac';
		errorText.className = 'popup__text';
		errorText.innerHTML = 'The room was not found';
		errorButton.className = 'btn btn--primary';
		errorButton.innerHTML = 'Return to homepage';
		errorButton.href = '/';
		errorPopup.appendChild(errorText);
		errorPopup.appendChild(errorButton);

		showPopup(errorPopup);

		return 0;
	}

	crAccordion();
	crSettings();
	crChat();
	requestUserId();
	authorization();
	usersOnlineMonitoring();
	usersInvitation();

})