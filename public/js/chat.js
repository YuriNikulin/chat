var socket = io.connect();

var firstChannel = io.connect("/first_channel");
var secondChannel = io.connect("/second_channel");

document.querySelector('#firstChannel').onclick = function() {
	firstChannel.send('hiii!');
}

document.querySelector('#secondChannel').onclick = function() {
	secondChannel.send('hiii!');
}

firstChannel.on('message', function(message) {
	console.log(message);
}); 

secondChannel.on('message', function(message) {
	console.log(message);
})

var container = document.querySelector('.s-chat-messages'),
	sendButton = document.querySelector('#send'),
	messageBody,
	messageType,
	userMessageField = document.querySelector('#message'),
	userMessageText,
	userMessageData = {},
	authPopup = document.querySelector('.popup--auth');

socket.on('message', function(data) {
	data = JSON.parse(data);
	displayMessage(data.author, data.date, data.message, data.type);
});

socket.on('name_set', function(data) {
	closePopup(authPopup);
	userMessageField.focus();
})

function displayMessage(messageAuthor, messageDate, messageText, messageType) {
	var displayAuthor = true,
		displayDate = true,
		messageAuthorSpan,
		messageBodyText,
		messageClass,
		messageDateSpan,
		formattedDate;

	if (messageType == 'myMessage') {
		messageClass = 's-chat-messages__message--self';
	}	else if (messageType == 'userMessage') {
		messageClass = 's-chat-messages__message--user';
	} 	else {
		messageClass = 's-chat-messages__message--server';
		displayAuthor = displayDate = false;
	}

	messageBody = document.createElement('div');
	messageBody.classList.add('s-chat-messages__message');
	if (displayAuthor) {
		messageAuthorSpan = document.createElement('span');
		messageBody.appendChild(messageAuthorSpan);
		messageAuthorSpan.classList.add('s-chat-messages__author');
		messageAuthorSpan.innerHTML = messageAuthor;
	}

	if (displayDate) {
		messageDateSpan = document.createElement('span');
		messageBody.appendChild(messageDateSpan);
		messageDateSpan.classList.add('s-chat-messages__date');
		formattedDate = new Date();
		formattedDate = (formattedDate.getHours()).toString() + ':' + leadingZero(formattedDate.getMinutes());
		messageDateSpan.innerHTML = formattedDate;
	}

	container.appendChild(messageBody);

	messageBody.classList.add(messageClass);
	messageBodyText = document.createElement('p');
	messageBody.appendChild(messageBodyText);
	messageBodyText.innerHTML = messageText;
	setTimeout(function() {
		messageBody.classList.add('shown');
	}, 10);


}

function sendMessageToServer() {
	userMessageText = userMessageField.value;
	if (!userMessageText) {
		return 0;
	}
	userMessageField.value = '';
	userMessageData.message = userMessageText;
	userMessageData.type = 'userMessage';
	socket.send(JSON.stringify(userMessageData));
}

sendButton.addEventListener('click', sendMessageToServer);
submitOnEnter(userMessageField, sendMessageToServer);

function authorization() {
	showPopup(authPopup);
	var authSubmit = document.querySelector('#auth-submit'),
		authInput = document.querySelector('#auth-name');
	authInput.focus();	
	authSubmit.addEventListener('click', function() {
		socket.emit("set_name", {name: authInput.value});
	});
	submitOnEnter(authInput, function() {
		socket.emit("set_name", {name: authInput.value});
	})
}

window.addEventListener('load', function() {
	authorization();
});

