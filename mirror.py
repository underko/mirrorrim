# interactive mirror by xjanockom

import time

time_night_start = 22
time_night_end = 8

mode_file_path = "./MODE"

while True:
    current_time = time.localtime
    if current_time.tm_hour >= time_night_start || current_time.tm_hour <= time_night_end:
        # todo night mode


def set_night_mode():
    