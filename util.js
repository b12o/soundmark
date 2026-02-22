export const SOUNDCLOUD_URL = "https://*.soundcloud.com/*";

export function truncateTitle(trackTitle, limit) {
  if (trackTitle.length > limit) {
    return trackTitle.substr(0, limit - 2) + "...";
  } else return trackTitle;
}
