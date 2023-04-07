// this style is injected into and removed from the DOM depending on whether
// the scrollbar exists in the popup window. Since the scrollbar takes up space at 
// the side which cant be used for styling, we simply remove it entirely if 
// we do not need it.
export const STYLES = `
#soundmarks_list {
	overflow-y: scroll;
}
.soundmarkListItem {
	width: calc(28rem - 14px) !important;
}
/* firefox scrollbar*/
* {
  scrollbar-width: thin;
  scrollbar-color: rbga(0, 0, 0, 0.5) transparent;
}

/* chromium scrollbar*/
::-webkit-scrollbar {
  width: 8px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.5);
  padding-right: 1rem;
  border-radius: 2rem;
}
::-webkit-scrollbar-thumb:hover {
  background: #c14000;
}
`