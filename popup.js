import { STYLES } from "./injectedStyle.js"

const SOUNDCLOUD_IS_PLAYING = (await chrome.tabs.query({
	url: "https://*.soundcloud.com/*",
	audible: true
})).length > 0

let STYLESHEET = undefined

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
	await chrome.runtime.sendMessage({
		message: "playSoundmark",
		trackLink,
		timeStamp,
		target: "background.js"
	})
	window.close()
}

const deleteSoundmark = async (id) => {
	chrome.runtime.sendMessage({
		message: "deleteSoundmark",
		id,
		target: "background.js"
	})
}

const truncateTitle = (trackTitle, limit) => {
	if (trackTitle.length > limit) {
		return trackTitle.substr(0, limit - 2) + "..."
	}
	else return trackTitle
}

const calculateMarqueeSpeed = (speed) => {
	// time = distance / speed
	let [marqueeSelector] = document.getElementsByClassName("songtrack-marquee")
	let marqueeSelectorLength = marqueeSelector.offsetWidth;
	let timeTaken = marqueeSelectorLength / speed;
	marqueeSelector.style.animationDuration = timeTaken + "s"
}

calculateMarqueeSpeed(10)

const displaySoundmarkList = async () => {
	chrome.storage.local.get(["soundmarks"]).then(async res => {

		if (res.soundmarks.length > 12) {
			// check if injected stylesheet already exists in the DOM
			if (!document.getElementById("STYLESHEET")) {
				STYLESHEET = document.createElement("style")
				STYLESHEET.id = "STYLESHEET"
				STYLESHEET.innerText = STYLES
				document.head.appendChild(STYLESHEET)
			}
		} else {
			if (document.getElementById("STYLESHEET")) {
				document.head.removeChild(STYLESHEET)
			}
		}

		let soundmarks = res.soundmarks.sort((a, b) => b.createdAt - a.createdAt) ?? [] //TODO : sort based on criteria specidied by user
		const soundmarkListItems = []

		for (const soundmark of soundmarks) {
			const soundmarkListItem = document.createElement("li")
			soundmarkListItem.style.cursor = "pointer"
			soundmarkListItem.classList.add("soundmarkListItem")
			soundmarkListItem.addEventListener("click", () => {
				playSoundmark(soundmark.trackLink, soundmark.timeStamp)
			})

			const soundmarkTrackTitle = document.createElement("div")
			soundmarkTrackTitle.classList.add("soundmarkListItemText")
			soundmarkTrackTitle.innerHTML = `${truncateTitle(soundmark.trackTitle, 60)}`
			soundmarkTrackTitle.style.display = "inline"

			const soundmarkTrackTimestamp = document.createElement("div")
			soundmarkTrackTimestamp.classList.add("soundmarkTrackTimestamp")
			soundmarkTrackTimestamp.innerHTML = `@ ${soundmark.timeStamp}`
			soundmarkTrackTimestamp.style.display = "inline"

			const buttonDeleteSoundmark = document.createElement("button")
			buttonDeleteSoundmark.classList.add("btn-delete-soundmark")
			const deleteIcon = document.createElement("img")
			deleteIcon.src = "assets/delete-icon.svg"
			deleteIcon.height = "14"
			deleteIcon.width = "14"
			deleteIcon.style.background = "transparent"
			buttonDeleteSoundmark.appendChild(deleteIcon)
			buttonDeleteSoundmark.addEventListener("click", e => {
				e.stopPropagation()
				deleteSoundmark(soundmark.id)
			})
			buttonDeleteSoundmark.style.display = "none"
			soundmarkListItem.addEventListener("mouseenter", () => {
				soundmarkTrackTitle.innerHTML = `${truncateTitle(soundmark.trackTitle, 45)}`
				buttonDeleteSoundmark.style.display = "inline"
			})
			soundmarkListItem.addEventListener("mouseleave", () => {
				soundmarkTrackTitle.innerHTML = `${truncateTitle(soundmark.trackTitle, 60)}`
				buttonDeleteSoundmark.style.display = "none"
			})

			soundmarkListItem.appendChild(soundmarkTrackTitle)
			soundmarkListItem.appendChild(soundmarkTrackTimestamp)
			soundmarkListItem.appendChild(buttonDeleteSoundmark)
			soundmarkListItems.push(soundmarkListItem)
		}
		document.getElementById("soundmarks_list").replaceChildren(...soundmarkListItems)
	})
}

// "Add soundmark" button should only be visibe if a track is currently playing
const [soundcloudTab] = await chrome.tabs.query({ url: "https://*.soundcloud.com/*", audible: true })
const [addSoundmarkDiv] = document.getElementsByClassName("add-soundmark")
const [soundcloudNotPlayingDiv] = document.getElementsByClassName("not-playing")
if (soundcloudTab) {
	addSoundmarkDiv.style.display = "flex"
	soundcloudNotPlayingDiv.style.display = "none"
}
else {
	addSoundmarkDiv.style.display = "none"
	soundcloudNotPlayingDiv.style.display = "flex"
}

// --- Listeners ---

chrome.runtime.onMessage.addListener((request) => {
	if (request.message === "refreshSoundmarks") displaySoundmarkList()
})

document.getElementById("go_to_soundcloud").addEventListener("click", async () => {
	await chrome.runtime.sendMessage({
		message: "openSoundcloud",
		target: "background.js"
	})
})

document.getElementById("btn_add_soundmark").addEventListener("click", async () => {
	// receive soundmark info from soundcloud.com content script
	const trackInfo = await getTrackInfo()
	if (trackInfo) {
		const now = Date.now()
		trackInfo.message.id = now
		trackInfo.message.createdAt = now
		await storeSoundmark(trackInfo)
	}
})

const getTrackInfo = async () => {
	const [soundcloudTab] = await chrome.tabs.query({
		url: "https://*.soundcloud.com/*",
		audible: true,
	})
	if (soundcloudTab) {
		const response = await chrome.tabs.sendMessage(
			soundcloudTab.id,
			{
				message: "getTrackInfo",
				target: "content.js"
			}
		)
		return response
	} else {
		addSoundmarkDiv.style.display = "none"
		soundcloudNotPlayingDiv.style.display = "flex"
	}
}

if (SOUNDCLOUD_IS_PLAYING) {
	const res = await getTrackInfo()
	document.getElementsByClassName("songtrack-marquee")[0].innerText = res.message.trackTitle
}

displaySoundmarkList()