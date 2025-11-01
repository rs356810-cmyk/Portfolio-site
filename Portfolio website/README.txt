Surya Pratap Yadav — Portfolio site (static)
Files location: /mnt/data/portfolio_site_surya

To use locally:
1. Unzip the package and open index.html in a browser (works offline).
2. For in-browser .xlsx preview, modern browsers allow reading the local files via the included SheetJS library — the files are under the 'files/' folder. If preview fails due to browser file access restrictions, host the folder on a simple static file server:
   - Python 3: `python3 -m http.server 8000` (run inside the site folder) then open http://localhost:8000
3. To enable in-cloud previews (recommended):
   - Upload each workbook in 'files/' to Google Drive, create a shareable link (anyone with link can view), and paste the share link into projects.json under the 'google_drive' field for each project.
   - Alternatively, upload to Dropbox and paste the 'dropbox' share link.
4. Contact form:
   - I added a Formspree action placeholder. Replace the form action in contact.html with your Formspree endpoint (or other form handler) before using the contact form. Example: https://formspree.io/f/yourid
5. Deployment:
   - Upload the whole folder to any static host (Netlify, Vercel static site, GitHub Pages). If you plan to host from your system and share the URL on LinkedIn, run a local static server and expose via a tunnel (ngrok) or host on a public service.

Notes:
- The projects.json file contains metadata and the hosted_file paths. Update google_drive/dropbox fields for cloud previews.
- All six Excel files are included in the 'files/' folder.
