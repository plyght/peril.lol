/**
 * Last.fm Configuration
 *
 * For local development:
 * 1. Get a Last.fm API key at https://www.last.fm/api/account/create
 * 2. Replace 'YOUR_API_KEY_HERE' with your actual API key
 * 3. Replace 'YOUR_LASTFM_USERNAME' with your Last.fm username
 * 
 * For production (GitHub Pages):
 * 1. Add LASTFM_API_KEY to GitHub repository secrets
 * 2. Add LASTFM_USERNAME to GitHub repository secrets
 * 3. The GitHub Action will automatically replace these values during deployment
 */
window.LASTFM_CONFIG = {
    apiKey: 'YOUR_API_KEY_HERE',
    username: 'YOUR_LASTFM_USERNAME'
};