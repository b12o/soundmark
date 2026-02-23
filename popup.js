import {
  SOUNDCLOUD_URL,
  generateSoundmarkListItem,
  sortSoundmarks,
  calculateMarqueeSpeed,
} from "./util.js";

const browserAPI = typeof browser !== "undefined" ? browser : chrome;

const [addSoundmarkDiv] = document.getElementsByClassName("add-soundmark");
const [marquee] = document.getElementsByClassName("marquee");
const [songTrackMarquee] = document.getElementsByClassName("songtrack-marquee");
const [notPlaying] = document.getElementsByClassName("not-playing");
const goToSoundcloudButton = document.getElementById("btn_go_to_soundcloud");
const addSoundmarkButton = document.getElementById("btn_add_soundmark");

async function initialize() {
  try {
    const [soundcloudTab] = await browserAPI.tabs.query({
      url: SOUNDCLOUD_URL,
      audible: true,
    });

    if (soundcloudTab) {
      await browserAPI.scripting.executeScript({
        target: { tabId: soundcloudTab.id },
        files: ["content.js"],
      });

      const res = await getTrackInfo();
      document.getElementsByClassName("songtrack-marquee")[0].innerText =
        res.message.trackTitle;

      addSoundmarkDiv.style.display = "flex";
      notPlaying.style.display = "none";
    } else {
      addSoundmarkDiv.style.display = "none";
      notPlaying.style.display = "flex";
    }

    songTrackMarquee.style.animationDuration = calculateMarqueeSpeed(
      songTrackMarquee,
      30,
    );
  } catch (error) {
    console.error("There was an error in initializing the extension: ", error);
  }
}

async function getTrackInfo() {
  const [soundcloudTab] = await browserAPI.tabs.query({
    url: SOUNDCLOUD_URL,
    audible: true,
  });
  if (soundcloudTab) {
    const response = await browserAPI.tabs.sendMessage(soundcloudTab.id, {
      message: "getTrackInfo",
      target: "content.js",
    });
    return response;
  } else {
    addSoundmarkDiv.style.display = "none";
    notPlaying.style.display = "flex";
  }
}

async function storeSoundmark(response) {
  const { id, trackTitle, trackLink, timeStamp, createdAt } = response.message;
  const res = await browserAPI.storage.local.get(["soundmarks"]);
  const soundmarks = res.soundmarks || [];
  soundmarks.push({
    id,
    trackTitle,
    trackLink,
    timeStamp,
    createdAt,
    timesPlayed: 1,
    lastPlayed: Math.round(Date.now() / 1000),
  });
  browserAPI.storage.local.set({ soundmarks });
  window.location.reload();
}

async function playSoundmark(id, trackLink, timeStamp) {
  await browserAPI.runtime.sendMessage({
    message: "playSoundmark",
    id,
    trackLink,
    timeStamp,
    target: "background.js",
  });
  window.close();
}

async function displaySoundmarkList() {
  const sortBy = (await browserAPI.storage.local.get(["sortBy"])).sortBy;
  const res = await browserAPI.storage.local.get(["soundmarks"]);
  if (!res.soundmarks.length) {
    document.getElementById("soundmarks_empty").style.display = "block";
    return;
  }

  let soundmarks = sortSoundmarks(res.soundmarks, sortBy);
  const soundmarkListItems = [];

  for (const soundmark of soundmarks) {
    const soundmarkListItem = generateSoundmarkListItem(soundmark);
    soundmarkListItem.addEventListener("click", () => {
      playSoundmark(soundmark.id, soundmark.trackLink, soundmark.timeStamp);
    });
    soundmarkListItems.push(soundmarkListItem);
  }
  document
    .getElementById("soundmark_list")
    .replaceChildren(...soundmarkListItems);
}

browserAPI.runtime.onMessage.addListener((request) => {
  if (request.message === "refreshSoundmarks") window.location.reload();
});

marquee.addEventListener("click", async () => {
  await browserAPI.runtime.sendMessage({
    message: "openSoundcloud",
    target: "background.js",
  });
  window.close();
});

goToSoundcloudButton.addEventListener("click", async () => {
  await browserAPI.runtime.sendMessage({
    message: "openSoundcloud",
    target: "background.js",
  });
  window.close();
});

addSoundmarkButton.addEventListener("click", async () => {
  const trackInfo = await getTrackInfo();
  if (trackInfo) {
    const now = Math.round(Date.now() / 1000);
    trackInfo.message.id = Math.random().toString(16).substring(2);
    trackInfo.message.createdAt = now;
    await storeSoundmark(trackInfo);
  }
});

initialize();
displaySoundmarkList();
