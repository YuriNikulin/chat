
var namespace = io('/' + getRoomId());


namespace.on('server_requests_username', function() {
	userName = getUserNickname();
	namespace.emit('user_sends_username', userName);
})

function crAccordion() {
	var container = document.querySelector('.cr-chat'),
		items = document.querySelectorAll('.cr-chat-item'),
		windowheight,
		contentSize;

	function calcContentSize() {
		windowHeight = getWindowHeight();
		contentSize = windowHeight / items.length - 100;
	}

	calcContentSize();

	for (var i = 0; i < items.length; i++) {
		items[i].querySelector('.cr-chat__title').onclick = function() {
			var parent = this.parentNode;
			if (parent.classList.contains('open')) {
				parent.classList.remove('open');
				parent.querySelector('.cr-chat-content').style = '';
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
	})

	sUsers.addEventListener('click', function() {
		toggleElem(crUsers);
	})
}

function crChat() {
	var container = document.querySelector('.cr-chat'),
		chat = container.querySelector('.chat'),
		input = container.querySelector('.chat-field__input'),
		send = container.querySelector('.chat-field__send'),
		messageData = {},
		messageText;

		send.addEventListener('click', sendMessageToServer);
		submitOnEnter(input, sendMessageToServer);

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
		msgText.innerHTML = data.message;
		msgContainer.appendChild(msgText);
		chatContainer.appendChild(msgContainer);
		chatScrollContainer.scrollTop = chatContainer.scrollHeight;
	})
}

window.addEventListener('load', function() {
	crAccordion();
	crSettings();
	crChat();
})