# interactive mirror by xjanockom

import subprocess
import time

time_night_start = 22
time_night_end = 8

while True:
    current_time = time.localtime
    if current_time.tm_hour >= time_night_start || current_time.tm_hour <= time_night_end:
        # todo night mode

def set_default_mode():
    focus_window("Mirrorrim - Default Screen")

def set_imhd_timetable_mode():
    focus_window("Mirrorrim - IMHD Timetable")

def set_night_mode():
    focus_window("Mirrorrim - Night screen")

def set_screen_off():
    run_command

def focus_window(title):
    run_command("wmctrl - \"{0}\"".format(title))

def run_command(command):
    subprocess.Popen(command)
