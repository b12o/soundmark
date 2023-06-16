import { STYLES } from "./injectedStyle.js"

let STYLESHEET = undefined

const [soundcloudTab] = await chrome.tabs.query({ url: "https://*.soundcloud.com/*", audible: true })
const [addSoundmarkDiv] = document.getElementsByClassName("add-soundmark")
const [marquee] = document.getElementsByClassName("marquee")
const [songTrackMarquee] = document.getElementsByClassName("songtrack-marquee")
const [soundcloudNotPlayingDiv] = document.getElementsByClassName("not-playing")
const goToSoundcloudButton = document.getElementById("go_to_soundcloud")
const addSoundmarkButton = document.getElementById("btn_add_soundmark")

const SOUNDCLOUD_IS_PLAYING = (await chrome.tabs.query({
	url: "https://*.soundcloud.com/*",
	audible: true
})).length > 0

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

const storeSoundmark = async (response) => {
	const { id, trackTitle, trackLink, timeStamp, createdAt } = response.message
	chrome.storage.local.get(["soundmarks"]).then((res) => {
		const soundmarks = res.soundmarks || []
		soundmarks.push({
			id,
			trackTitle,
			trackLink,
			timeStamp,
			createdAt,
			timesPlayed: 1
		})
		chrome.storage.local.set({ soundmarks })
	})
}

const playSoundmark = async (id, trackLink, timeStamp) => {
	await chrome.runtime.sendMessage({
		message: "playSoundmark",
		id,
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
	let songTrackMarqueeLength = songTrackMarquee.offsetWidth;
	let timeTaken = songTrackMarqueeLength / speed;
	songTrackMarquee.style.animationDuration = timeTaken + "s"
}

calculateMarqueeSpeed(10)

const getTimestampInSeconds = (timestampString) => {
	let seconds = 0
	let multiplier = 1
	for (let num of timestampString.split(':').reverse()) {
		seconds += parseInt(num) * multiplier
		multiplier *= 60
	}
	return seconds
}

const displaySoundmarkList = async () => {
	const sortBy = (await chrome.storage.local.get(["sortBy"])).sortBy
	chrome.storage.local.get(["soundmarks"]).then(async res => {

		if (res.soundmarks.length === 0) {
			document.getElementById("soundmarks_empty").style.display = "block"
		}

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

		let soundmarks = res.soundmarks ?? []
		if (soundmarks.length && sortBy === "newest") {
			soundmarks = soundmarks.sort((a, b) => b.createdAt - a.createdAt)
		}
		if (soundmarks.length && sortBy === "oldest") {
			soundmarks = soundmarks.sort((a, b) => a.createdAt - b.createdAt)
		}
		if (soundmarks.length && sortBy === "track_title") {
			// first sort all soundmarks by timestamp location, then sort by track title
			soundmarks.forEach(x => x.timestampInSeconds = getTimestampInSeconds(x.timeStamp))
			soundmarks = soundmarks
				.sort((a, b) => a.timestampInSeconds - b.timestampInSeconds)
				.sort((a, b) => a.trackTitle.localeCompare(b.trackTitle))
		}
		if (soundmarks.length && sortBy === "most_played") {
			soundmarks = soundmarks.sort((a, b) => b.timesPlayed - a.timesPlayed)
		}
		if (soundmarks.length && sortBy === "least_played") {
			soundmarks = soundmarks.sort((a, b) => a.timesPlayed - b.timesPlayed)
		}


		const soundmarkListItems = []

		for (const soundmark of soundmarks) {
			const soundmarkListItem = document.createElement("li")
			soundmarkListItem.style.cursor = "pointer"
			soundmarkListItem.classList.add("soundmarkListItem")
			soundmarkListItem.addEventListener("click", () => {
				playSoundmark(soundmark.id, soundmark.trackLink, soundmark.timeStamp)
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

if (SOUNDCLOUD_IS_PLAYING) {
	const res = await getTrackInfo()
	document.getElementsByClassName("songtrack-marquee")[0].innerText = res.message.trackTitle
}

if (soundcloudTab) {
	addSoundmarkDiv.style.display = "flex"
	soundcloudNotPlayingDiv.style.display = "none"
}
else {
	addSoundmarkDiv.style.display = "none"
	soundcloudNotPlayingDiv.style.display = "flex"
}

chrome.runtime.onMessage.addListener((request) => {
	if (request.message === "refreshSoundmarks") {
		window.location.reload()
	}
})

marquee.addEventListener("click", async () => {
	await chrome.runtime.sendMessage({
		message: "openSoundcloud",
		target: "background.js"
	})
	window.close()
})

goToSoundcloudButton.addEventListener("click", async () => {
	await chrome.runtime.sendMessage({
		message: "openSoundcloud",
		target: "background.js"
	})
	window.close()
})

addSoundmarkButton.addEventListener("click", async () => {
	const trackInfo = await getTrackInfo()
	if (trackInfo) {
		const now = Math.round(Date.now() / 1000)
		trackInfo.message.id = Math.random().toString(16).substring(2)
		trackInfo.message.createdAt = now
		await storeSoundmark(trackInfo)
	}
})

displaySoundmarkList()