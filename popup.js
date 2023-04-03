// save soundmark
const storeSoundmark = async (response) => {
	const { id, trackTitle, trackLink, timeStamp, createdAt } = response.message

	chrome.storage.local.get(["soundmarks"]).then((res) => {
		const soundmarks = res.soundmarks || []
		soundmarks.push({
			id,
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
		timeStamp,
		to: "background.js"
	})
}

const deleteSoundmark = async (id) => {
	chrome.runtime.sendMessage({
		message: "deleteSoundmark",
		id,
		to: "background.js"
	})
}

const displaySoundmarks = async () => {

	const sortBy = 
	chrome.storage.local.get(["soundmarks"]).then(res => {

		let soundmarks = res.soundmarks || [] //TODO : sort based on criteria specidied by user
		const soundmarkListItems = []



		for (const soundmark of soundmarks) {
			const soundmarkListItem = document.createElement("li")
			soundmarkListItem.classList.add("soundmarkListItem")
			soundmarkListItem.style.marginTop = "1rem"
			soundmarkListItem.style.listStyleType = "none"

			const soundmarkLinkDiv = document.createElement("div")
			soundmarkLinkDiv.innerText = `${soundmark.trackTitle} @ ${soundmark.timeStamp}`
			soundmarkLinkDiv.style.cursor = "pointer"
			soundmarkLinkDiv.style.display = "inline"
			soundmarkLinkDiv.addEventListener("click", () => {
				playSoundmark(soundmark.trackLink, soundmark.timeStamp)
			})

			const buttonDeleteSoundmark = document.createElement("button")
			buttonDeleteSoundmark.innerText = "D"
			buttonDeleteSoundmark.addEventListener("click", () => {
				deleteSoundmark(soundmark.id)
			})

			soundmarkListItem.appendChild(soundmarkLinkDiv)
			soundmarkListItem.appendChild(buttonDeleteSoundmark)

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
	document.getElementsByClassName("main")[0].style.display = "none"
})

document.getElementById("close_settings").addEventListener("click", () => {
	document.getElementsByClassName("main")[0].style.display = "block"
	document.getElementsByClassName("settings")[0].style.display = "none"
})

document.getElementById("add_soundmark").addEventListener("click", async () => {

	// receive soundmark info from soundcloud.com content script
	const [soundcloudTab] = await chrome.tabs.query({ url: "https://*.soundcloud.com/*", audible: true, })
	const response = await chrome.tabs.sendMessage(
		soundcloudTab.id,
		{ message: "getSoundMark", to: "content.js" }
	)
	await storeSoundmark(response)
})

document.getElementById("clear_soundmarks").addEventListener("click", async () => {
	if (confirm("Are you sure you want to delete your saved soundmarks?")) {
		await chrome.storage.local.clear()
		displaySoundmarks()
	}
})


// render soundmarks
chrome.runtime.onMessage.addListener((request) => {
	if (request.message === "refreshSoundmarks") displaySoundmarks()
})

displaySoundmarks()