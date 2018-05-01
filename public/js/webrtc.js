var webrtcObj = {},
	videoResolution = 1.33,
	mainVideoContainer = document.querySelector('.cr-video-main'),
	webrtcUsers = {};

var iceServersRequestUrl = "https://networktraversal.googleapis.com/v1alpha/iceconfig?key=AIzaSyAJdh2HkajseEIltlZ3SIXO02Tze9sO3NY";

webrtcObj.config = {
	'iceServers': 
		[
			{"urls":["stun:64.233.165.127:19302","stun:[2A00:1450:4010:C08::7F]:19302"]},
			{"urls":["turn:64.233.165.127:19305?transport=udp",
			"turn:[2A00:1450:4010:C01::7F]:19305?transport=udp",
			"turn:64.233.165.127:19305?transport=tcp",
			"turn:[2A00:1450:4010:C01::7F]:19305?transport=tcp"],
			"username":"COjoodcFEgYtHi8cOA4Yzc/s6OMTIICjBQ",
			"credential":"7El/rU/IX973eE+G5E2yV3rviHk="}
		],
};

var bandwidthLimit = getFromCookie('chatRoomBandwidth');
if (bandwidthLimit) webrtcObj.config.bandwidthLimit = bandwidthLimit;

namespace.on('webrtcMsg', function(data) {
	if (data.msg.type == 'offer') {
		webrtcUsers[data.from.wid] = new WebRTCUser(data.from);
		webrtcUsers[data.from.wid].attachStreamToPc();
		webrtcUsers[data.from.wid].handleOffer(data.msg);
	} else if (data.msg.type == 'answer') {
		webrtcUsers[data.from.wid].handleAnswer(data.msg);
	} else if (data.msg.type == 'candidate') {
		webrtcUsers[data.from.wid].handleCandidate(data.msg);
	}
	
})

namespace.on('w_user_disconnected', function(user) {
	user = webrtcUsers[user];
	if (user) {
		user.remove();
	}
})

function setBandwidth(sdp) {
	var limit = 100
    sdp = sdp.replace(/a=mid:audio\r\n/g, 'a=mid:audio\r\nb=AS:' + limit + '\r\n');
    sdp = sdp.replace(/a=mid:video\r\n/g, 'a=mid:video\r\nb=AS:' + limit + '\r\n');
    return sdp;
}

function WebRTCUser(user) {
	var self = this;
	this.stream = webrtcObj.stream;
	this.pc = new RTCPeerConnection(webrtcObj.config);
	this.pc.onicecandidate = function(event) {
		if (event.candidate) {
			webrtcMsg(currentUser, self.wid, {
				'type': 'candidate',
				'candidate': event.candidate
			});
		}
	}

	this.pc.onaddstream = function(e) {
		self.videoElem = addVideoElem(e.stream, false, self);
	}

	this.remove = function() {
		var video = self.videoElem;
		var parent = video.parentNode;
		if (video && parent) {
			hideElem(video);
			if (parent.clone) {
				var cloneVideo = parent.clone.querySelector('video');
				hideElem(cloneVideo);
				setTimeout(function() {
					hideElem(parent.clone, true);
				}, animDurationSm);
			}
			setTimeout(function() {
				hideElem(parent, true);
			}, animDurationSm)
		}
		delete webrtcUsers[self.wid];
	}

	this.username = user.username;
	this.wid = user.wid || user.id;
	this.iceCandidates = [];

	this.attachStreamToPc = function() {
		var stream = this.stream;
		var pc = this.pc;
		var tracks = stream.getTracks();
		if (typeof(pc.addTrack) == 'function') {
			for (var i = 0; i < tracks.length; i++) {
				pc.addTrack(tracks[i], stream);
			}
		} else {
			pc.addStream(stream);
		}	
	}

	this.doCall = function() {
		var pc = this.pc;
		var wid = this.wid;
		pc.createOffer().then(function(offer) {
			
			
				offer.sdp = setBandwidth(offer.sdp);
			
			pc.setLocalDescription(offer);
			webrtcMsg(currentUser, wid, offer);
		})
	}

	this.handleCandidate = function(candidate) {
		console.log(candidate);
		candidate = new RTCIceCandidate(candidate.candidate);
		this.pc.addIceCandidate(candidate);
	}

	this.handleOffer = function(offer) {
		var pc = this.pc;
		var wid = this.wid;
		var remoteDescription = new RTCSessionDescription(offer);
		pc.setRemoteDescription(offer).then(function() {
			pc.createAnswer().then(function(answer) {
				pc.setLocalDescription(answer);
				webrtcMsg(currentUser, wid, answer);
			})
		});
	}

	this.handleAnswer = function(answer) {
		
		
			answer.sdp = setBandwidth(answer.sdp);
		
		var pc = this.pc;
		pc.setRemoteDescription(answer).then(function() {
			console.log('Answer has been processed');
		})
	}
}

function addVideoElem(stream, muted, self) {
	var container = document.querySelector('.cr-video-items');
	var mainContainer = mainVideoContainer;
	var videoElemContainer = basicRender('div', 'cr-video-item', container);
	var videoElem = basicRender('video', 'cr-video-item__video', videoElemContainer);
	if (self.username) {
		var usernameElem = basicRender('span', 'cr-video-item__user', videoElemContainer);
		usernameElem.innerHTML = self.username;
	}

	if (self == currentUser) {
		videoElem.dataset.self = true;
		videoElem.muted = true;
	}
	
	videoElem.srcObject = stream;
	videoElem.autoplay = true;
	videoElemContainer.addEventListener('click', function() {
		videoTogglerCheck(this, container, mainContainer);
	});
	videoElem.webrtcObj = self;

	showElem(videoElemContainer);
	setTimeout(function() {
		resizeElem(videoElem, videoResolution);
		showElem(videoElem);
	}, animDurationSm);
	return videoElem;
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

function getListOfUsersInRoom() {
	namespace.emit('w_user_requests_list_of_users', currentUser.wid);

	namespace.on('w_server_fetches_list_of_users', function(data) {
		for (var i = 0; i < data.length; i++) {
			var user = JSON.parse(data[i]);
			if (user.id == currentUser.wid) {
				continue;
			}
			webrtcUsers[user.id] = new WebRTCUser(user);
			webrtcUsers[user.id].attachStreamToPc();
			webrtcUsers[user.id].doCall();
		}
	})
}

webrtcConstraints = {
	width: {
		max: 768 
	},
	height: {
		max: 768
	}
};

function crGetUserMedia() {
	if (crHasUserMedia()) {
		navigator.getUserMedia = crHasUserMedia();
	}

	navigator.getUserMedia({
		video: webrtcConstraints,
		audio: webrtcObj.audio
	}, function(stream){
		addVideoElem(stream, true, currentUser);
		webrtcObj.stream = stream;
		if (crHasRTCPeerConnection()) {
			getListOfUsersInRoom();
		} else {
			showErrorPopup('Your browser doesn\'t support WebRTC');
		}

	}, function(error) {
		showErrorPopup(error.message);
	})
};

function crHasRTCPeerConnection() {
	window.RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
	return !!window.RTCPeerConnection;
}

function bandwidthChange() {
	var bandwidthChangeSelectbox = document.querySelector('#video-bandwidth');
	var bandwidthChangeSpan = bandwidthChangeSelectbox.querySelector('.selectbox__title');
	bandwidthChangeSelectbox.addEventListener('selectboxChange', function() {
		var newBandwidth = bandwidthChangeSpan.dataset.value;
		document.cookie = 'chatRoomBandwidth=' + (newBandwidth == 'auto' ? '' : newBandwidth);
		window.location.replace('/chatroom');
	})
}


window.addEventListener('load', function() {
	crGetConnection();
	bandwidthChange();
});
window.addEventListener('resize', function() {
	setTimeout(function() {
		resizeAllVideos(videoResolution);
	}, animDurationSm);
	checkMainVideoContainer(mainVideoContainer, activeVideoBreakpoints[getAdaptiveMode()]);
})
