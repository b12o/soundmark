const validateSoundmarks = (soundmarksArray) => {
	let counter = 0
	if (!(soundmarksArray instanceof Array)) {
		return { result: false, message: "Can not read file", soundmarks: undefined }
	}
	for (let item of soundmarksArray) {
		console.log(item)
		if (!item.createdAt
			|| !item.id
			|| !item.timeStamp
			|| !item.trackLink
			|| isNaN(item.timesPlayed) 
			|| isNaN(item.lastPlayed)
			|| !item.trackTitle) {
			return { result: false, message: "A required property does not exist.", soundmarks: undefined }
		}
		if (!item.trackLink.includes("https://soundcloud.com/")) {
			return { result: false, message: "One or more track links are invalid.", soundmarks: undefined }
		}
		if (item.id.length !== 13) {
			return { result: false, message: "One or more IDs are invalid.", soundmarks: undefined }
		}
		for (let elem of item.timeStamp.split(':')) {
			if (isNaN(elem) || elem.length > 2) {
				return { result: false, message: "One or more timestamps are invalid.", soundmarks: undefined }
			}
		}
		const dateFromString = new Date(item.createdAt)
		if (isNaN(dateFromString)) {
			return { result: false, message: "One or more dates are invalid.", soundmarks: undefined }
		}
		counter++;
	}
	if (counter === soundmarksArray.length) {
		soundmarksArray.forEach(x => x.createdAt = new Date(x.createdAt).getTime() / 1000)
		return { result: true, message: "Import successful", soundmarks: soundmarksArray }
	}
	else return false
}

const parseFile = (file) => {
	let parsedFile
	try { parsedFile = JSON.parse(file) }
	catch { alert("Could not read file.") }
	return parsedFile
}

const tryImport = async (parsedFile) => {
	if (parsedFile) {
		const { result, message, soundmarks } = validateSoundmarks(parsedFile)
		if (result) {
			await chrome.storage.local.set({ soundmarks })
			document.getElementById("upload_title").innerText = "Successfully imported soundmarks file!"
			document.getElementById("import_success").style.display = "block"
			document.getElementById("btn_select_file").style.display = "none"
		}
		else alert(`Error: ${message}`)
	}
}

const fileSelector = document.createElement("input")
fileSelector.id = "file_selector"
fileSelector.style.display = "none"
fileSelector.setAttribute("type", "file")
fileSelector.addEventListener("change", () => {
	const reader = new FileReader()
	reader.onload = () => {
		const parsedFile = parseFile(reader.result)
		tryImport(parsedFile)
	}
	reader.readAsText(fileSelector.files[0])
})
document.body.appendChild(fileSelector)

document.getElementById("btn_select_file").addEventListener("click", () => {
	fileSelector.click()
})