console.log(document.cookie);

var namespace = io('/' + getRoomId());
namespace.on('message', function(data) {
	debugger;
	console.log(data);
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

window.addEventListener('load', function() {
	crAccordion();
	crSettings();
})