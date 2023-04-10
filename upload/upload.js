import { parseFile, validateSoundmarks } from "../importValidator.js"


const validate = async (parsedFile) => {
	if (parsedFile) {
		const { result, reason, soundmarks } = validateSoundmarks(parsedFile)
		if (result) {
			await chrome.storage.local.set({ soundmarks })
			document.getElementById("upload_title").innerText = "Successfully loaded soundmarks file!"
			document.getElementById("import_success").style.display = "block"
			document.getElementById("select_file").style.display = "none"
		}
		else alert(`Error: ${reason}`)
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
		validate(parsedFile)
	}
	reader.readAsText(fileSelector.files[0])
})
document.body.appendChild(fileSelector)

document.getElementById("select_file").addEventListener("click", () => {
	fileSelector.click()
})