#!/bin/bash

SOURCE="${BASH_SOURCE[0]}"
while [ -h "$SOURCE" ]; do # resolve $SOURCE until the file is no longer a symlink
  DIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"
  SOURCE="$(readlink "$SOURCE")"
  [[ $SOURCE != /* ]] && SOURCE="$DIR/$SOURCE" # if $SOURCE was a relative symlink, we need to resolve it relative to the path where the symlink file was located
done
DIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"

# kill all existing instances of chromium & unclutter
pkill chromium
pkill unclutter

# hide mouse pointer when inactive
unclutter -idle 1 &

# start jasper
/home/pi/jasper/jasper.py

# open chromium windows with mirror screens for faster switching between them
chromium-browser --disable-web-security --user-data-dir --new-window --kiosk --test-type "$DIR/web/imhd_timetable.html" &
chromium-browser --disable-web-security --user-data-dir --new-window --kiosk --test-type "$DIR/web/night_screen.html" &
chromium-browser --disable-web-security --user-data-dir --new-window --kiosk --test-type "$DIR/web/default_screen.html" &

sleep 5

# start mirror controller after delay
python /home/pi/doc/mirrorrim/mirror.py

# focus default screen
wmctrl -a "MirrorriM - Default Screen"

exit 0
