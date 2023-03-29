window.addEventListener("load", () => {

	chrome.runtime.onMessage.addListener(
		(request, _, sendResponse) => {
			if (request.message === "getSoundMark") {
				const [trackInfo] = document.getElementsByClassName("playbackSoundBadge__titleLink")
				const [timeStamp] = document.getElementsByClassName("playbackTimeline__timePassed")

				sendResponse({
					message: {
						trackTitle: trackInfo.title,
						trackLink: trackInfo.href,
						timeStamp: timeStamp.lastChild.innerHTML,
						createdAt: Date.now()
					},
					to: "popup.js"

				})
			}
		})
})

