document.getElementById("confirm_clear_soundmarks").style.display = "none"

let sortSelected

const clearSoundmarksButton = document.getElementById("clear_soundmarks")
const confirmClearSoundmarks = document.getElementById("confirm_clear_soundmarks")
const importSoundmarksButton = document.getElementById("import_soundmarks")
const exportSoundmarksButton = document.getElementById("export_soundmarks")
const saveSettingsButton = document.getElementById("save_settings")
const clearSoundmarksSeparator = document.getElementById("sep_clear_soundmarks")

const numberOfSoundmarks = (await chrome.storage.local.get(["soundmarks"])).soundmarks.length
const sorting = (await chrome.storage.local.get(["sortBy"])).sortBy

for (const selectOption of document.getElementsByClassName("select-option")) {
  if (selectOption.id.includes(sorting)) {
    selectOption.setAttribute("selected", "")
  }
}
document.getElementById("sort_by").addEventListener("change", event => {
  sortSelected = event.target.value
})

if (!numberOfSoundmarks) {
  clearSoundmarksButton.style.display = "none"
  clearSoundmarksSeparator.style.display = "none"
}
else {
  clearSoundmarksButton.addEventListener("click", () => {
    clearSoundmarksButton.style.display = "none"
    confirmClearSoundmarks.style.display = "flex"
  })
}

if (confirmClearSoundmarks) {
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

importSoundmarksButton.addEventListener("click", async () => {
  // extension popup can not handle file imports. Use a dedicated page instead
  await chrome.tabs.create({ url: "./upload/upload.html" })
})

exportSoundmarksButton.addEventListener("click", async () => {
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

saveSettingsButton.addEventListener("click", async () => {
  if (sortSelected) {
    await chrome.storage.local.set({ sortBy: sortSelected })
  }
  window.location.href = "./popup.html"
})