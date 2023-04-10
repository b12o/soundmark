
const validateSoundmarks = (soundmarksArray) => {
	let counter = 0
	if (!(soundmarksArray instanceof Array)) {
		return { result: false, reason: "Can not read file", soundmarks: undefined }
	}
	for (let item of soundmarksArray) {
		if (!item.createdAt
			|| !item.id
			|| !item.timeStamp
			|| !item.trackLink
			|| !item.trackTitle) {
			return { result: false, reason: "A required property does not exist.", soundmarks: undefined }
		}
		if (!item.trackLink.includes("https://soundcloud.com/")) {
			return { result: false, reason: "One or more track links are invalid.", soundmarks: undefined }
		}
		if (item.id.length !== 13) {
			return { result: false, reason: "One or more IDs are invalid.", soundmarks: undefined }
		}
		for (let elem of item.timeStamp.split(':')) {
			if (isNaN(elem) || elem.length > 2) {
				return { result: false, reason: "One or more timestamps are invalid.", soundmarks: undefined }
			}
		}
		const dateFromString = new Date(item.createdAt)
		if (isNaN(dateFromString)) {
			return { result: false, reason: "One or more dates are invalid.", soundmarks: undefined }
		}
		counter++;
	}
	if (counter == soundmarksArray.length) {
		soundmarksArray.forEach(x => x.createdAt = new Date(x.createdAt).getTime() / 1000)
		return { result: true, reason: "Import successful", soundmarks: soundmarksArray }
	}
	else return false
}


const parseFile = (file) => {
	let parsedFile

	try {
		parsedFile = JSON.parse(file)
	}
	catch {
		alert("Could not read file.")
	}
	return parsedFile
}


export { validateSoundmarks, parseFile }

