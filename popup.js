// save soundmark
const storeSoundmark = async (response) => {
	const { trackTitle, trackLink, timeStamp, createdAt } = response.message

	chrome.storage.local.get(["soundmarks"]).then((res) => {
		const soundmarks = res.soundmarks || []
		soundmarks.push({
			trackTitle,
			trackLink,
			timeStamp,
			createdAt
		})
		chrome.storage.local.set({ soundmarks })
	})

}

const playSoundmark = async (trackLink, timeStamp) => {
	chrome.runtime.sendMessage({
		message: "playSoundmark",
		trackLink,
		timeStamp
	})
}

const displaySoundmarks = async () => {
	chrome.storage.local.get(["soundmarks"]).then(res => {
		const soundmarks = res.soundmarks || []
		const soundmarkListItems = []
		for (const soundmark of soundmarks) {
			const soundmarkListItem = document.createElement("li")
			soundmarkListItem.style.marginTop = "1rem"
			soundmarkListItem.style.listStyleType = "none"
			const soundmarkLink = document.createElement("a")
			soundmarkLink.innerText = `${soundmark.trackTitle} @ ${soundmark.timeStamp}`
			soundmarkLink.style.cursor = "pointer"
			soundmarkLink.addEventListener("click", () => {
				playSoundmark(soundmark.trackLink, soundmark.timeStamp)
			})
			soundmarkListItem.appendChild(soundmarkLink)
			soundmarkListItems.push(soundmarkListItem)
		}
		document.getElementById("soundmarks-list").replaceChildren(...soundmarkListItems)
	})
}

// "Add soundmark" button should only be visibe if a track is currently playing
chrome.tabs.query({ url: "https://*.soundcloud.com/*", audible: true, })
	.then(soundcloudTab => {
		const addSoundmark = document.getElementById("add_soundmark")
		if (soundcloudTab.length) addSoundmark.style.display = "inline-block"
		else addSoundmark.style.display = "none"
	})

document.getElementById("show_settings").addEventListener("click", () => {
	document.getElementsByClassName("settings")[0].style.display = "block"
	document.getElementsByClassName("soundmarks")[0].style.display = "none"
})

document.getElementById("close_settings").addEventListener("click", () => {
	document.getElementsByClassName("soundmarks")[0].style.display = "block"
	document.getElementsByClassName("settings")[0].style.display = "none"
})

document.getElementById("add_soundmark").addEventListener("click", async () => {

	// receive soundmark info from soundcloud.com content script
	const [activeTab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true })
	const response = await chrome.tabs.sendMessage(
		activeTab.id,
		{ message: "getSoundMark", to: "content.js" }
	)
	await storeSoundmark(response)
})

document.getElementById("clear_soundmarks").addEventListener("click", async () => {
	await chrome.storage.local.clear()
	displaySoundmarks()
})


// render soundmarks
chrome.runtime.onMessage.addListener((request) => {
	if (request.message === "refreshSoundmarks") displaySoundmarks()
})

displaySoundmarks()