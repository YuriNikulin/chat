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
}

function closePopup(popup) {
	if (!popup) {
		return 0;
	}

	popup.classList.remove('shown');
	removeOverlay();
	setTimeout(function() {
		popup.style.display = '';
	}, 300);
}

window.addEventListener('load', function() {
	chatSizeCalculate();
});