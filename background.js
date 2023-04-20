chrome.storage.local.get(["soundmarks"]).then(async res => {
	if (!res.soundmarks) {
		await chrome.storage.local.set({
			soundmarks: [],
			sortBy: "newest"
		})
	}
})

const getSoundcloudTab = async () => {
	let [soundcloudTab] = await chrome.tabs.query({
		url: "https://*.soundcloud.com/*",
		audible: true,
	})
	if (!soundcloudTab) {
		[soundcloudTab] = await chrome.tabs.query({
			url: "https://*.soundcloud.com/*",
			lastFocusedWindow: true
		})
	}
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
	console.log(key)
	if (key === "soundmarks") {
		chrome.storage.local.get(["soundmarks"]).then(async () => {
			try {
				await chrome.runtime.sendMessage({
					message: "refreshSoundmarks",
					target: "popup.js"
				})
			} catch {
				console.log("popup.html not active. No need to send refresh")
			}
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
