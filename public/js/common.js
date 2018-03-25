var currentUser = {},
	userNickname,
	maxUsersCount = 16,
	gutter = 15,
	videoResolution = 1.33,
	animDuration = 300,
	adaptiveBreakpoints = [
		{'mode': 'xxl', 'value': 2560},
		{'mode': 'xl', 'value': 1400},
		{'mode': 'lg', 'value': 1024},
		{'mode': 'md', 'value': 768},
		{'mode': 'sm', 'value': 620},
	],
	activeVideoBreakpoints = {
		'xxl': 3,
		'xl': 2,
		'lg': 2,
		'md': 1,
		'sm': 1
	},
	maxActiveVideoCounter = 2,
	body = document.querySelector('body');

