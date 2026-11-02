for n in "$@"; do
timeout 150 "/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu --hide-scrollbars --user-data-dir=C:/Users/matty/AppData/Local/Temp/b3c-$n --window-size=1280,720 --force-device-scale-factor=1 --virtual-time-budget=2000 --screenshot=C:/Users/matty/spirit-launch/docs/mockups/tree-v3/$n.png file:///C:/Users/matty/spirit-launch/docs/mockups/tree-v3/src/$n.html 2>&1 | grep written
done
echo b3shots-done
