// should not be visible by default
document.getElementsByClassName("collapse-soundmarks")[0].style.display = "none"
document.getElementById("confirm_clear_soundmarks").style.display = "none"

let sortSelected
const numberOfSoundmarks = (await chrome.storage.local.get(["soundmarks"])).soundmarks.length
console.log(numberOfSoundmarks)

// get sorting preference from chrome storage
const sorting = await chrome.storage.local.get(["sortBy"])
for (const selectOption of document.getElementsByClassName("select-option")) {
	if (selectOption.id.includes(sorting.sortBy)) {
		selectOption.setAttribute("selected", "")
		if (sorting.sortBy.includes("track_title")) {
			const isChecked = (await chrome.storage.local.get(["collapseSoundmarks"])).collapseSoundmarks
			if (isChecked) document.getElementById("collapse_soundmarks").checked = isChecked
			document.getElementsByClassName("collapse-soundmarks")[0].style.display = "block"
		}
	}
}
// if user selects sort by track title, add further option to collapse soundmarks from same track
document.getElementById("sort_by").addEventListener("change", async evt => {
	sortSelected = evt.target.value
	if (sortSelected === "track_title") {
		const isChecked = (await chrome.storage.local.get(["collapseSoundmarks"])).collapseSoundmarks
		if (isChecked) document.getElementById("collapse_soundmarks").checked = isChecked
		document.getElementsByClassName("collapse-soundmarks")[0].style.display = "block"
	}
	else {
		document.getElementsByClassName("collapse-soundmarks")[0].style.display = "none"
	}
})

// if user has no soundmarks, do not display clear soundmarks button 
const clearSoundmarksButton = document.getElementById("clear_soundmarks")
const confirmClearSoundmarks = document.getElementById("confirm_clear_soundmarks")

if (!numberOfSoundmarks) {
	document.getElementById("clear_soundmarks").style.display = "none"
} else {
	clearSoundmarksButton.addEventListener("click", () => {
		clearSoundmarksButton.style.display = "none"
		confirmClearSoundmarks.style.display = "flex"
	})
}
// if user clicked on "clear soundmarks", the confirmation dialog should be displayed
if (document.getElementById("confirm_clear_soundmarks")) {
	const [yesButton] = document.getElementsByClassName("btn-confirm-yes")
	const [noButton] = document.getElementsByClassName("btn-confirm-no")

	yesButton.addEventListener("click", async () => {
		await chrome.storage.local.set({ "soundmarks": [] })
		confirmClearSoundmarks.style.display = "none";
		clearSoundmarksButton.style.display = "block"
		window.location.reload()
	})

	noButton.addEventListener("click", () => {
		confirmClearSoundmarks.style.display = "none";
		clearSoundmarksButton.style.display = "block"
	})
}

// import
document.getElementById("import_soundmarks").addEventListener("click", async () => {
	await chrome.tabs.create({
		url: "./upload/upload.html"
	})
})

// export
const saveSoundmarksButton = document.getElementById("export_soundmarks")
saveSoundmarksButton.addEventListener("click", async () => {
	let soundmarks = (await chrome.storage.local.get(["soundmarks"])).soundmarks
	soundmarks.forEach(x => x.createdAt = new Date(x.createdAt * 1000).toLocaleString())
	const soundmarksJson = JSON.stringify(soundmarks)
	const blob = new Blob([soundmarksJson], {
		type: "application/json"
	})
	chrome.downloads.download({
		url: window.URL.createObjectURL(blob),
		filename: "soundmarks.json"
	})
})

// save settings
document.getElementById("save_options").addEventListener("click", async () => {
	if (sortSelected) {
		await chrome.storage.local.set({ sortBy: sortSelected })
	}
	const collapseSoundmarks = document.getElementById("collapse_soundmarks")
	if (collapseSoundmarks) {
		await chrome.storage.local.set({ collapseSoundmarks: collapseSoundmarks.checked })
	}
	window.location.href = "./popup.html"
})
