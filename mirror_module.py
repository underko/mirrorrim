# -*- coding: utf-8-*-

import re

WORDS = ["TRAM", "BUS", "PUBLIC", "TRANSPORT", "TIMETABLE", "SCHEDULE", "RESET"]
PRIORITY = 10

def set_file_mode(mode):
    mode_file = open("/home/pi/doc/mirrorrim/MODE", "w")
    mode_file.write(mode)
    mode_file.close()

def handle(text, mic, profile):
    timetable = ["TRAM", "BUS", "PUBLIC", "TRANSPORT", "TIMETABLE", "SCHEDULE"]
    reset = ["RESET"]

    if any(word.lower() in text.lower() for word in timetable):
        set_file_mode("IMHD")
    elif any(word.lower() in text.lower() for word in reset):
        set_file_mode("RESET")
    else:
        pass

def isValid(text):
    return any(word.lower() in text.lower() for word in WORDS)
