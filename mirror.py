# interactive mirror by xjanockom

import subprocess
import time
from gpiozero import MotionSensor

WORDS = ["TRAM", "BUS", "PUBLIC", "TRANSPORT", "TIMETABLE", "SCHEDULE"]
PRIORITY = 10

time_night_start = 22
time_night_end = 8

pir = MotionSensor(4)

print("Debug: Starting")

while True:
    current_time = time.localtime
    print("Debug: current_time: {0}".format(current_time))
    if current_time.tm_hour >= time_night_start || current_time.tm_hour <= time_night_end:
        print("Debug: Night mode.")
        if (pir.motion_detected):
            print("Debug: Night mode. Motion detected.")
            set_night_mode()
        else:
            print("Debug: Night mode. Screen off.")
            set_screen_off()
    else:
        print("Debug: Default screen.")
        set_default_mode()

    time.sleep(1)

def set_default_mode():
    focus_window("Mirrorrim - Default Screen")

def set_imhd_timetable_mode():
    focus_window("Mirrorrim - IMHD Timetable")

def set_night_mode():
    focus_window("Mirrorrim - Night screen")

def set_screen_off():
    print("Debug: Screen turned off TMP function.")

def focus_window(title):
    run_command("wmctrl - \"{0}\"".format(title))

def run_command(command):
    subprocess.Popen(command)

def isValid(text):
    return any(word.lower() in text.lower() for word in WORDS)

def handle(text, mic, profile):
    print("Debug: Displaying IMHD table.")
    set_imhd_timetable_mode()
    time.sleep(5)
