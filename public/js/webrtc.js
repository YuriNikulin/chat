window.addEventListener('load', function() {
	var webrtcObj = {};
	webrtcObj.config = {
		'iceServers': [{ "url": "stun:stun.1.google.com:19302" }]
	};

	function addVideoElem(stream) {
		var container = document.querySelector('.cr-video-items');
		var videoElemContainer = basicRender('div', 'cr-video-item', container);
		var videoElem = basicRender('video', 'cr-video-item__video', videoElemContainer);
		videoElem.src = window.URL.createObjectURL(stream);
		videoElem.autoplay = true;
	}

	function crGetConnection() {
		if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
		    navigator.enumerateDevices = function(callback) {
		        navigator.mediaDevices.enumerateDevices().then(callback);
		    };
		}

		var MediaDevices = [];
		var isHTTPs = location.protocol === 'https:';
		var canEnumerate = false;

		if (typeof MediaStreamTrack !== 'undefined' && 'getSources' in MediaStreamTrack) {
		    canEnumerate = true;
		} else if (navigator.mediaDevices && !!navigator.mediaDevices.enumerateDevices) {
		    canEnumerate = true;
		}

		var hasMicrophone = false;
		var hasSpeakers = false;
		var hasWebcam = false;

		var isMicrophoneAlreadyCaptured = false;
		var isWebcamAlreadyCaptured = false;

		function checkDeviceSupport(callback) {
		    if (!canEnumerate) {
		        return;
		    }

		    if (!navigator.enumerateDevices && window.MediaStreamTrack && window.MediaStreamTrack.getSources) {
		        navigator.enumerateDevices = window.MediaStreamTrack.getSources.bind(window.MediaStreamTrack);
		    }

		    if (!navigator.enumerateDevices) {
		        if (callback) {
		            callback();
		        }
		        return;
		    }

		    MediaDevices = [];
		    navigator.enumerateDevices(function(devices) {
		        for (var i = 0; i < devices.length; i++) {
		        	var _device = devices[i];
		            var device = {};
		            for (var d in _device) {
		                device[d] = _device[d];
		            }

		            if (device.kind === 'audio') {
		                device.kind = 'audioinput';
		            }

		            if (device.kind === 'video') {
		                device.kind = 'videoinput';
		            }

		            var skip;
		            MediaDevices.forEach(function(d) {
		                if (d.id === device.id && d.kind === device.kind) {
		                    skip = true;
		                }
		            });

		            if (skip) {
		                return;
		            }

		            if (!device.deviceId) {
		                device.deviceId = device.id;
		            }

		            if (!device.id) {
		                device.id = device.deviceId;
		            }

		            if (!device.label) {
		                device.label = 'Please invoke getUserMedia once.';
		                if (!isHTTPs) {
		                    device.label = 'HTTPs is required to get label of this ' + device.kind + ' device.';
		                }
		            } else {
		                if (device.kind === 'videoinput' && !isWebcamAlreadyCaptured) {
		                    isWebcamAlreadyCaptured = true;
		                }

		                if (device.kind === 'audioinput' && !isMicrophoneAlreadyCaptured) {
		                    isMicrophoneAlreadyCaptured = true;
		                }
		            }

		            if (device.kind === 'audioinput') {
		                hasMicrophone = true;
		            }

		            if (device.kind === 'audiooutput') {
		                hasSpeakers = true;
		            }

		            if (device.kind === 'videoinput') {
		                hasWebcam = true;
		            }

		            MediaDevices.push(device);
		        };

		        if (callback) {
		            callback();
		        }
		    });
		}
		checkDeviceSupport(function() {
			webrtcObj.audio = hasMicrophone;
			webrtcObj.video = hasWebcam;
			crGetUserMedia();
		})
	}

	function crHasUserMedia() {
		return (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia); 
	}

	function startPeerConnection(stream) {
		var localConnection = new RTCPeerConnection(webrtcObj.config);
		localConnection.addStream(stream);

		localConnection.createOffer().then(function(offer) {
			namespace.emit('webrtcMsg', JSON.stringify(offer));

			console.log(offer);
			return localConnection.setLocalDescription(offer);
		});

		namespace.on('webrtcMsg', function(data) {
			data = JSON.parse(data);
			if (data.type == 'offer') {
				var remoteConnection = new RTCPeerConnection(webrtcObj.conf);
				var remoteDescription = new RTCSessionDescription(data);
				remoteConnection.setRemoteDescription(remoteDescription).then(function() {
					console.log('normal');
					remoteConnection.createAnswer().then(function(answer) {
						console.log('voobshe ok');
						return remoteConnection.setLocalDescription(answer);
					}).then(function() {
						console.log('polnyi kaef');
					})
				});

				// localConnection.createAnswer().then(function(answer) {
				// 	return localConnection.setLocalDescription(answer);
				// }).then(function() {
				// 	console.log('success');
				// })
				// debugger;
			}
		})

	}

	function crGetUserMedia() {
		if (crHasUserMedia()) {
			navigator.getUserMedia = crHasUserMedia();
		}

		navigator.getUserMedia({
			video: webrtcObj.video,
			audio: false
		}, function(stream){
			addVideoElem(stream);

			if (crHasRTCPeerConnection()) {
				startPeerConnection(stream);
			} else {
				showErrorPopup('Your browser doesn\'t support WebRTC');
			}

		}, function(error) {
			console.log(error);
		})
	};

	function crHasRTCPeerConnection() {
		window.RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
		return !!window.RTCPeerConnection;
	}

	crGetConnection();
})
