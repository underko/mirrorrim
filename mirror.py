# interactive mirror by xjanockom

import subprocess
import time
import datetime
from gpiozero import MotionSensor

def run_command(command):
    subprocess.Popen(command, shell=True, stdout=subprocess.PIPE)

def focus_window(title):
    run_command('wmctrl -a "{0}"'.format(title))

def set_default_mode():
    focus_window("Mirrorrim - Default Screen")

def set_imhd_timetable_mode():
    focus_window("Mirrorrim - IMHD Timetable")

def set_night_mode():
    focus_window("Mirrorrim - Night screen")

def set_screen_off():
    print("Debug: Screen turned off TMP function.")

def reset_program():
    run_command("./startup.sh")

def is_mode_set(mode):
    mode_file = open("/home/pi/doc/mirrorrim/MODE", "r")
    content = mode_file.readline()
    mode_file.close()

    if mode in content:
        return True
    else:
        return False

def set_mode_file(mode):
    mode_file = open("/home/pi/doc/mirrorrim/MODE", "w")
    content = mode_file.write(mode)
    mode_file.close()

time_night_start = 22
time_night_end = 8

pir = MotionSensor(4)

print("Debug: Starting")

while True:
    current_time = datetime.datetime.now()
    print("Debug: current_time: {0}".format(current_time))
    if is_mode_set("RESET"):
        print("Debug: RESET mode. Reseting")
        reset_program()
        time.sleep(10)
        set_mode_file("DEFAULT")
    elif is_mode_set("IMHD"):
        print("Debug: IMHD mode. Sleeping")
        set_imhd_timetable_mode()
        time.sleep(10)
        set_mode_file("DEFAULT")
    else:
        if current_time.hour >= time_night_start or current_time.hour <= time_night_end:
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
