#!/bin/bash
echo "OpenVPN DOWN script called"

# Restore original resolv.conf
if [ -f /etc/resolv.conf.backup ]; then
    cp /etc/resolv.conf.backup /etc/resolv.conf
    echo "Restored original /etc/resolv.conf"
fi

# Clean up
rm -f /etc/resolv.conf.openvpn /etc/resolv.conf.backup
