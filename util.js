const browserAPI = typeof browser !== "undefined" ? browser : chrome;

export const SOUNDCLOUD_URL = "https://*.soundcloud.com/*";
export const IS_CHROME = browserAPI === chrome;

export const REVIEW_URL = IS_CHROME
  ? "https://chromewebstore.google.com/detail/soundmark-for-soundcloud/\
mehaefgchoneblgknhbijmemjmdkhdoh/reviews"
  : "https://addons.mozilla.org/en-US/firefox/addon/soundmark/reviews/\
?utm_content=search&utm_medium=referral&utm_source=addons.mozilla.org";

export function truncateTitle(trackTitle, limit) {
  if (trackTitle.length > limit) {
    return trackTitle.substr(0, limit - 2) + "...";
  } else return trackTitle;
}

async function deleteSoundmark(id) {
  await browserAPI.runtime.sendMessage({
    message: "deleteSoundmark",
    id,
    target: "background.js",
  });
}

function getTimestampInSeconds(timestampString) {
  let seconds = 0;
  let multiplier = 1;
  for (let num of timestampString.split(":").reverse()) {
    seconds += parseInt(num) * multiplier;
    multiplier *= 60;
  }
  return seconds;
}

export function generateSoundmarkListItem(soundmark) {
  const soundmarkListItem = document.createElement("li");
  soundmarkListItem.style.cursor = "pointer";
  soundmarkListItem.classList.add("soundmark-list-item");

  const soundmarkTrackTitle = document.createElement("div");
  soundmarkTrackTitle.classList.add("soundmark-list-item-text");
  soundmarkTrackTitle.innerHTML = `${truncateTitle(soundmark.trackTitle, 45)}`;
  soundmarkTrackTitle.style.display = "inline";

  const soundmarkAtSymbol = document.createElement("div");
  soundmarkAtSymbol.innerHTML = "@";
  soundmarkAtSymbol.classList.add("soundmark-list-item-at-symbol");
  soundmarkAtSymbol.style.display = "inline";

  const soundmarkTrackTimestamp = document.createElement("div");
  soundmarkTrackTimestamp.classList.add("soundmark-track-timestamp");
  soundmarkTrackTimestamp.innerHTML = `${soundmark.timeStamp}`;
  soundmarkTrackTimestamp.style.display = "inline";

  const buttonDeleteSoundmark = document.createElement("button");
  buttonDeleteSoundmark.classList.add("btn-delete-soundmark");
  buttonDeleteSoundmark.id = "dele_soundmark";
  const deleteIcon = document.createElement("img");
  deleteIcon.src = "assets/delete-icon.svg";
  deleteIcon.height = "14";
  deleteIcon.width = "14";
  deleteIcon.style.background = "transparent";
  buttonDeleteSoundmark.appendChild(deleteIcon);
  buttonDeleteSoundmark.addEventListener("click", (e) => {
    e.stopPropagation();
    deleteSoundmark(soundmark.id);
  });
  buttonDeleteSoundmark.style.display = "none";
  soundmarkListItem.addEventListener("mouseenter", () => {
    soundmarkTrackTitle.innerHTML = `${truncateTitle(soundmark.trackTitle, 35)}`;
    buttonDeleteSoundmark.style.display = "block";
  });
  soundmarkListItem.addEventListener("mouseleave", () => {
    soundmarkTrackTitle.innerHTML = `${truncateTitle(soundmark.trackTitle, 45)}`;
    buttonDeleteSoundmark.style.display = "none";
  });

  soundmarkListItem.appendChild(soundmarkTrackTitle);
  soundmarkListItem.appendChild(soundmarkAtSymbol);
  soundmarkListItem.appendChild(soundmarkTrackTimestamp);
  soundmarkListItem.appendChild(buttonDeleteSoundmark);
  return soundmarkListItem;
}

export function sortSoundmarks(soundmarks, sortBy) {
  switch (sortBy) {
    case "newest":
      soundmarks = soundmarks.sort((a, b) => b.createdAt - a.createdAt);
      break;
    case "oldest":
      soundmarks = soundmarks.sort((a, b) => a.createdAt - b.createdAt);
      break;
    case "track_title":
      // first sort all soundmarks by timestamp location, then sort by track title
      soundmarks.forEach(
        (x) => (x.timestampInSeconds = getTimestampInSeconds(x.timeStamp)),
      );
      soundmarks = soundmarks
        .sort((a, b) => a.timestampInSeconds - b.timestampInSeconds)
        .sort((a, b) => a.trackTitle.localeCompare(b.trackTitle));
      break;
    case "most_played":
      soundmarks = soundmarks.sort((a, b) => b.timesPlayed - a.timesPlayed);
      break;
    case "least_played":
      soundmarks = soundmarks.sort((a, b) => a.timesPlayed - b.timesPlayed);
      break;
    case "recently_played":
      soundmarks = soundmarks.sort((a, b) => b.lastPlayed - a.lastPlayed);
      break;
  }
  return soundmarks;
}

export function calculateMarqueeSpeed(elem, speed) {
  let songTrackMarqueeLength = elem.offsetWidth;
  let timeTaken = songTrackMarqueeLength / speed;
  return `${timeTaken}s`;
}
