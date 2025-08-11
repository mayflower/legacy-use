#!/bin/bash
echo "OpenVPN UP script called with:"
echo "Interface: $dev"
echo "Local IP: $ifconfig_local"
echo "Remote IP: $ifconfig_remote"
echo "Environment variables:"
env | grep -E "^(route_|dhcp_option_)" || echo "No route/dhcp options found"

# Backup original resolv.conf
cp /etc/resolv.conf /etc/resolv.conf.backup

# Handle pushed DNS servers
if [ -n "$foreign_option_1" ]; then
    echo "Processing foreign options:"
    env | grep foreign_option

    # Create new resolv.conf with VPN DNS servers
    > /etc/resolv.conf.openvpn

    for optname in $(env | grep '^foreign_option_' | cut -d= -f1); do
        option=$(env | grep "^$optname=" | cut -d= -f2-)
        echo "Processing: $option"

        if echo "$option" | grep -q "^dhcp-option DNS"; then
            dns_server=$(echo "$option" | sed 's/dhcp-option DNS //')
            echo "nameserver $dns_server" >> /etc/resolv.conf.openvpn
            echo "Added DNS server: $dns_server"
        fi

        if echo "$option" | grep -q "^dhcp-option DOMAIN"; then
            domain=$(echo "$option" | sed 's/dhcp-option DOMAIN //')
            echo "search $domain" >> /etc/resolv.conf.openvpn
            echo "domain $domain" >> /etc/resolv.conf.openvpn
            echo "Added domain: $domain"
        fi
    done

    # Use OpenVPN DNS if we found any, otherwise keep original
    if [ -s /etc/resolv.conf.openvpn ]; then
        cat /etc/resolv.conf.openvpn > /etc/resolv.conf
        echo "Updated /etc/resolv.conf with VPN DNS servers"
    else
        echo "No VPN DNS servers found, keeping original resolv.conf"
    fi
fi

# Add any additional routes if needed
echo "Current routes after OpenVPN connection:"
ip route
