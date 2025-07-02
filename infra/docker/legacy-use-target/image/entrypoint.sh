#!/bin/bash
set -e

export DISPLAY=:${DISPLAY_NUM}
./xvfb_startup.sh
./x11vnc_startup.sh
./novnc_startup.sh

./start_vpn.sh &
sleep 5 # allow vpn to start
./start_remote_screen.sh &

./start_computer_api.sh


