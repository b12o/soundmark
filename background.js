import { SOUNDCLOUD_URL } from "./util.js";

const browserAPI = typeof browser !== "undefined" ? browser : chrome;

async function getSoundcloudTab() {
  let [soundcloudTab] = await browserAPI.tabs.query({
    url: SOUNDCLOUD_URL,
    audible: true,
  });
  if (!soundcloudTab) {
    [soundcloudTab] = await browserAPI.tabs.query({
      url: SOUNDCLOUD_URL,
      lastFocusedWindow: true,
    });
  }
  if (!soundcloudTab) {
    [soundcloudTab] = await browserAPI.tabs.query({
      url: SOUNDCLOUD_URL,
    });
  }
  if (soundcloudTab) return soundcloudTab;
  else return false;
}

browserAPI.storage.local.get(["soundmarks"]).then(async (res) => {
  if (!res.soundmarks) {
    await browserAPI.storage.local.set({
      soundmarks: [],
      sortBy: "newest",
    });
  } else {
    for (const soundmark of res.soundmarks) {
      if (!soundmark["timesPlayed"]) {
        soundmark["timesPlayed"] = 0;
      }
      if (!soundmark["lastPlayed"]) {
        soundmark["lastPlayed"] = 0;
      }
    }
    await browserAPI.storage.local.set({
      soundmarks: res.soundmarks,
    });
  }
});

browserAPI.storage.onChanged.addListener(async (changes) => {
  let [key] = Object.entries(changes)[0];
  console.log(key);
  if (key === "soundmarks") {
    await browserAPI.storage.local.get(["soundmarks"]);
    try {
      await browserAPI.runtime.sendMessage({
        message: "refreshSoundmarks",
        target: "popup.js",
      });
    } catch {
      console.log("popup.html not active. No need to send refresh");
    }
  }
});

browserAPI.runtime.onMessage.addListener(async (request) => {
  if (request.message === "openSoundcloud") {
    const soundcloudTab = await getSoundcloudTab();
    if (soundcloudTab) {
      const tabWindow = soundcloudTab.windowId;
      await browserAPI.windows.update(tabWindow, { focused: true });
      await browserAPI.tabs.update(soundcloudTab.id, { highlighted: true });
    } else {
      await browserAPI.tabs.create({ url: "https://soundcloud.com" });
    }
  }

  if (request.message === "playSoundmark") {
    const soundmarkId = request.id;
    const trackLink = request.trackLink;
    const timeStamp = request.timeStamp;
    const soundcloudTab = await getSoundcloudTab();

    if (soundcloudTab) {
      const soundcloudTabIndex = soundcloudTab.index;
      const tabWindow = soundcloudTab.windowId;
      await browserAPI.windows.update(tabWindow, { focused: true });
      await browserAPI.tabs.update(soundcloudTab.id, { highlighted: true });

      if (soundcloudTab.url.includes(trackLink)) {
        // can not reload a tab if the url is identical, so recreate tab.
        await browserAPI.tabs.create({
          url: `${trackLink}#t=${timeStamp}`,
          windowId: tabWindow,
          index: soundcloudTabIndex,
        });
        await browserAPI.tabs.remove(soundcloudTab.id);
      } else {
        await browserAPI.tabs.update(soundcloudTab.id, {
          url: `${trackLink}#t=${timeStamp}`,
        });
      }
    } else {
      await browserAPI.tabs.create({ url: `${trackLink}#t=${timeStamp}` });
    }
    let soundmarks = (await browserAPI.storage.local.get(["soundmarks"]))
      .soundmarks;
    const soundmark = soundmarks.find(
      (soundmark) => soundmark.id === soundmarkId,
    );
    soundmark["timesPlayed"] += 1;
    soundmark["lastPlayed"] = Math.round(Date.now() / 1000);
    await browserAPI.storage.local.set({
      soundmarks: soundmarks,
    });
  }

  if (request.message === "deleteSoundmark") {
    const res = await browserAPI.storage.local.get(["soundmarks"]);
    const soundmarks = res.soundmarks.filter((x) => x.id !== request.id);
    await browserAPI.storage.local.set({ soundmarks });
    await browserAPI.runtime.sendMessage({
      message: "refreshSoundmarks",
      target: "popup.js",
    });
  }
});
