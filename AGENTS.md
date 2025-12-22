# Agent Guidelines for Soundmark

## Project Structure
Browser extension (Chrome/Firefox) for SoundCloud bookmarking. No build system - plain JavaScript, HTML, CSS.

## Testing & Development
- No automated tests or build commands
- Manual testing: Load unpacked extension from root directory in Chrome/Firefox
- Manifest versions: `manifest.chrome.json` (v3) and `manifest.firefox.json` (v2)

## Code Style
- **Variables**: camelCase, descriptive names (e.g., `soundcloudTab`, `trackTitle`)
- **Constants**: camelCase for simple constants, SCREAMING_SNAKE_CASE not used
- **Browser API**: Always use `const browserAPI = typeof browser !== "undefined" ? browser : chrome` for cross-browser compatibility
- **Spacing**: 2-space indentation, no semicolons after closing braces
- **Async/await**: Prefer async/await over .then() chains for new code
- **Error handling**: Use try-catch for async operations, log errors with `console.error()` or `console.log()`
- **CSS**: CSS variables in `:root` with descriptive prefixes (`--bg-`, `--col-`, `--bd-`)
- **String literals**: Double quotes for strings, template literals for interpolation
- **Array destructuring**: Use for single element arrays: `const [element] = array`

## Commit Messages
Lowercase imperative mood without periods (e.g., "add screenshots", "update min version to allow support for...")
