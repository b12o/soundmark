// if no sorting criteria exists, det default to 'newest'
const sorting = chrome.storage.local.get(["sortBy"]).then(async (res) => {
	if (!res.sortBy) await chrome.storage.local.set({ sortBy: "newest" })
})

// if no theme preference exists, set default to 'light'
const theme = chrome.storage.local.get(["theme"]).then(async (res) => {
	if (!res.theme) await chrome.storage.local.set({ theme: "light" })
})

const getSoundcloudTab = async () => {
	// find currently playing soundcloud tab
	let [soundcloudTab] = await chrome.tabs.query({
		url: "https://*.soundcloud.com/*",
		audible: true,
	})

	// if no soundcloud tab is playing, find soundcloud tab in this current window
	if (!soundcloudTab) {
		[soundcloudTab] = await chrome.tabs.query({
			url: "https://*.soundcloud.com/*",
			lastFocusedWindow: true
		})
	}

	// if no soundcloud tab in last focused window has been found, find any active soundcloud tab
	if (!soundcloudTab) {
		[soundcloudTab] = await chrome.tabs.query({
			url: "https://*.soundcloud.com/*",
		})
	}

	if (soundcloudTab) return soundcloudTab
	else return false

}

chrome.storage.onChanged.addListener((changes) => {
	let [key] = Object.entries(changes)[0]
	if (key === "soundmarks") {
		chrome.storage.local.get(["soundmarks"]).then(async () => {
			await chrome.runtime.sendMessage({
				message: "refreshSoundmarks",
				target: "popup.js"
			})
		})
	}
})

chrome.runtime.onMessage.addListener(async (request) => {
	if (request.message === "openSoundcloud") {
		const soundcloudTab = await getSoundcloudTab()
		if (soundcloudTab) {
			const tabWindow = soundcloudTab.windowId
			await chrome.windows.update(tabWindow, { focused: true })
			await chrome.tabs.update(soundcloudTab.id, { highlighted: true })
		}
		else {
			await chrome.tabs.create({ url: "https://soundcloud.com" })
		}
	}
	if (request.message === "playSoundmark") {
		const trackLink = request.trackLink
		const timeStamp = request.timeStamp

		const soundcloudTab = await getSoundcloudTab()

		if (soundcloudTab) {
			const soundcloudTabIndex = soundcloudTab.index
			const tabWindow = soundcloudTab.windowId
			await chrome.windows.update(tabWindow, { focused: true })
			await chrome.tabs.update(soundcloudTab.id, { highlighted: true })

			if (soundcloudTab.url.includes(trackLink)) {
				// can not reload a tab if the url is identical, so recreate tab.
				await chrome.tabs.create({
					url: `${trackLink}#t=${timeStamp}`,
					windowId: tabWindow,
					index: soundcloudTabIndex
				})
				await chrome.tabs.remove(soundcloudTab.id)
			}
			else {
				await chrome.tabs.update(soundcloudTab.id, { url: `${trackLink}#t=${timeStamp}` })
			}
		}
		else {
			await chrome.tabs.create({ url: `${trackLink}#t=${timeStamp}` })
		}
	}

	if (request.message === "deleteSoundmark") {
		chrome.storage.local.get(["soundmarks"]).then(res => {
			let soundmarks = res.soundmarks
			soundmarks = soundmarks.filter(x => x.id !== request.id)
			chrome.storage.local.set({ soundmarks }).then(async () => {
				await chrome.runtime.sendMessage({
					message: "refreshSoundmarks",
					target: "popup.js"
				})
			})
		})
	}
})
