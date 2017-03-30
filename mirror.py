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
    run_command('xset dpms force on')
    focus_window("Mirrorrim - Default Screen")

def set_imhd_timetable_mode():
    run_command('xset dpms force on')
    focus_window("Mirrorrim - IMHD Timetable")

def set_night_mode():
    run_command('xset dpms force on')
    focus_window("Mirrorrim - Night screen")

def set_screen_off():
    run_command('xset dpms force off')

def reset_program():
    run_command("/home/pi/doc/mirrorrim/startup.sh")

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

def reload_chrome():
    run_command("/home/pi/doc/mirrorrim/refresh.sh")

def jasper_active():
    # todo return true if jasper is running
    # should be >2 lines
    # jasper_processes=$(ps -ef | grep '/home/pi/jasper/jasper.py' | wc -l)

def start_jasper():
    run_command('/home/pi/jasper/jasper.py')

time_night_start = 22
time_night_end = 8

pir = MotionSensor(4)

print("Debug: Starting")

reset_counter = 0
reset_limit = 300

while True:
    current_time = datetime.datetime.now()
    print("Debug: current_time: {0}".format(current_time))

    if jasper_active() is False:
        start_jasper()

    reset_counter += 1
    if reset_counter >= reset_limit:
        print("Debug: Automatic reset.")
        reset_counter = 0
        reload_chrome()
    
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
            if pir.motion_detected:
                print("Debug: Night mode. Motion detected.")
                set_night_mode()
            else:
                print("Debug: Night mode. Screen off.")
                set_screen_off()
        else:
            print("Debug: Default screen.")
            set_default_mode()

    time.sleep(1)
