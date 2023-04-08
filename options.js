const validateImportedSoundmarks = (soundmarksJson) => {
	/* 
	validation criteria:
		- requires createdAt property
		- requires id property
		- requires timeStamp property
		- requires trackLink property
		- requires trackTitle property
		
		- trackLink must start with https://soundcloud.com/
	*/
	console.log(soundmarksJson)
	return false;
}

const importSoundmarks = async (file) => {
	let soundmarksJson
	try {
		soundmarksJson = JSON.parse(file)
	}
	catch {
		alert("Could not read file.")
		return
	}
	if (validateImportedSoundmarks(soundmarksJson)) {
		chrome.storage.local.set({ soundmarks: soundmarksJson })
	}
	else alert("something went wrong while importing file.")
}


// should not be visible by default
document.getElementsByClassName("collapse-soundmarks")[0].style.display = "none"
document.getElementById("confirm_clear_soundmarks").style.display = "none"

let sortSelected
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

// import 
const fileSelector = document.createElement("input")
fileSelector.id = "fileSelector"
fileSelector.style.display = "none"
fileSelector.setAttribute("type", "file")
fileSelector.onchange = () => {
	const reader = new FileReader()
	reader.onload = e => {
		importSoundmarks(e.target.result)
	}
	reader.readAsText(fileSelector.files[0])
}
document.body.appendChild(fileSelector)

const loadSoundmarksButton = document.getElementById("import_soundmarks")
loadSoundmarksButton.addEventListener("click", () => {
	fileSelector.click()
})

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



