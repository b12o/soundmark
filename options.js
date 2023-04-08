// should not be visible by default
document.getElementsByClassName("collapse-soundmarks")[0].style.display = "none"
document.getElementById("confirm_clear_soundmarks").style.display = "none"

let sortSelected = undefined // TODO: when saving, check if undefined
const numberOfSoundmarks = (await chrome.storage.local.get(["soundmarks"])).soundmarks.length

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
	clearSoundmarksButton.getElementById("clear_soundmarks").style.display = "none"
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

	// TODO: implement after saving soundmarks to file has been implemented 
	yesButton.addEventListener("click", () => {
		alert("ok. will delete soundmarks")
		confirmClearSoundmarks.style.display = "none";
		clearSoundmarksButton.style.display = "block"
	})

	noButton.addEventListener("click", () => {
		confirmClearSoundmarks.style.display = "none";
		clearSoundmarksButton.style.display = "block"
	})
}

const saveSoundmarksButton = document.getElementById("export_soundmarks")
saveSoundmarksButton.addEventListener("click", async () => {
	const soundmarks = (await chrome.storage.local.get(["soundmarks"])).soundmarks
	const soundmarksJson = JSON.stringify(soundmarks)
	const blob = new Blob([soundmarksJson], {
		type: "application/json"
	})
	chrome.downloads.download({
		url: window.URL.createObjectURL(blob),
		filename: "soundmarks.json"
	})
})

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



