#!/bin/bash
# Double-click this file to launch the OKR Dashboard with live data from the sheet.
# It starts a tiny local web server and opens the dashboard in your browser.
cd "$(dirname "$0")"
open "http://localhost:8765/index.html"
python3 -m http.server 8765
