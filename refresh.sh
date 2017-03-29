#!/bin/bash

IFS='\n'
chromium_window_ids=($(xdotool search --class '.*chromium.*'))

echo $chromium_window_ids

for chromium_id in $chromium_window_ids; do
    xdotool windowactivate ${chromium_id}
    xdotool key ctrl+F5
done
