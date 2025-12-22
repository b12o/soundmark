import browserAPI from "./browser-api"

browserAPI.runtime.onMessage.addListener(
  (request, _, sendResponse) => {
    if (request.message === "getTrackInfo") {
      const [trackInfo] = document.getElementsByClassName("playbackSoundBadge__titleLink")
      const [timeStamp] = document.getElementsByClassName("playbackTimeline__timePassed")
      sendResponse({
        message: {
          trackTitle: trackInfo.title,
          trackLink: trackInfo.href.split('?')[0],
          timeStamp: timeStamp.lastChild.innerHTML,
        },
        target: "popup.js"
      })
    }
  })

