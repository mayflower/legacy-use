#!/bin/bash
set -e

echo "Starting VPN..."

if [ "$REMOTE_VPN_TYPE" = 'wireguard' ]; then
    echo "Writing wireproxy config..."

    echo "$VPN_CONFIG" > wireproxy.toml && cat <<EOF >> wireproxy.toml
[Socks5]
BindAddress = 127.0.0.1:1080
EOF

    LOG_FILE=/tmp/wireproxy.log
    HANDSHAKE_PATTERN="Sending handshake initiation"

    echo "Starting wireproxy..."
    ~/go/bin/wireproxy -c wireproxy.toml >> "$LOG_FILE" 2>&1 &

    WIREPROXY_PID=$!

    echo "Watchdog started..."

    # Watchdog loop
    while true; do
        COUNT=$(tail -n 50 "$LOG_FILE" | grep "$HANDSHAKE_PATTERN" | tail -n 5 | wc -l)
        if [ "$COUNT" -ge 5 ]; then
            echo "$(date) - Detected $COUNT handshakes in a row, restarting wireproxy"
            kill "$WIREPROXY_PID"
            sleep 2
            ~/go/bin/wireproxy -c wireproxy.toml >> "$LOG_FILE" 2>&1 &
            WIREPROXY_PID=$!
        fi
        sleep 10
    done
elif [ "$REMOTE_VPN_TYPE" = 'tailscale' ]; then
    echo "Starting tailscale..."
    sudo tailscaled --tun=userspace-networking  --socks5-server=localhost:1080  &
    sudo tailscale up --authkey=${VPN_CONFIG}
elif [ "$REMOTE_VPN_TYPE" = 'openvpn' ]; then
    echo "Starting openvpn..."

    # Create authentication file for OpenVPN using VPN_CONFIG
    # Expects the following format:
    # <USER>\n<PASSWORD>
    AUTH_FILE="/tmp/openvpn_auth.txt"
    echo "$VPN_USERNAME" > "$AUTH_FILE"
    echo "$VPN_PASSWORD" >> "$AUTH_FILE"
    chmod 600 "$AUTH_FILE"

    # Create TUN device files and interface
    sudo mkdir -p /dev/net
    
    # Create /dev/net/tun device file if it doesn't exist
    if [ ! -c /dev/net/tun ]; then
        sudo mknod /dev/net/tun c 10 200
        sudo chmod 666 /dev/net/tun
    fi
    
    # Load TUN module
    echo "Loading TUN module..."
    if command -v modprobe >/dev/null 2>&1; then
        sudo modprobe tun 2>/dev/null || true
    fi
    
    if ip link show tun0 2>/dev/null; then
        sudo ip link delete tun0 2>/dev/null || true
    fi
    
    sudo ip tuntap add dev tun0 mode tun 2>/dev/null || true

    # Decode base64 config to temporary file
    CONFIG_FILE="/tmp/openvpn_config.ovpn"
    echo "$VPN_CONFIG" | base64 -d > "$CONFIG_FILE"
    chmod 600 "$CONFIG_FILE"
    
    # Start OpenVPN using the temporary config file
    OPENVPN_LOG="/tmp/openvpn.log"
    echo "Starting OpenVPN with logging to $OPENVPN_LOG..."
    sudo openvpn --config "$CONFIG_FILE" \
        --auth-user-pass "$AUTH_FILE" \
        --verb 3 \
        --log "$OPENVPN_LOG" \
        --data-ciphers "AES-256-GCM:AES-128-GCM:AES-128-CBC:CHACHA20-POLY1305" \
        --cipher AES-128-CBC \
        --dev tun0 \
        --daemon

    # Wait for OpenVPN connection
    for i in {1..30}; do
        if ip addr show tun0 2>/dev/null | grep -q "inet "; then
            echo "OpenVPN connected"
            break
        fi
        sleep 2
    done
    
    # Start SOCKS proxy that routes through OpenVPN TUN interface
    if ip addr show tun0 2>/dev/null | grep -q "inet "; then
        echo "Starting SOCKS proxy on 127.0.0.1:1080 that routes through OpenVPN..."
        
        # Start the Python SOCKS proxy server
        python3 /socks_proxy.py &
        
        SOCKS_PID=$!
        echo "SOCKS proxy started with PID: $SOCKS_PID"
        
        # Give proxy a moment to start
        sleep 2
    else
        echo "OpenVPN connection failed - tun0 interface not available"
        exit 1
    fi
    
    # Clean up temporary config file and authentication file
    rm -f "$CONFIG_FILE"
    rm -f "$AUTH_FILE"

elif [ "$REMOTE_VPN_TYPE" = 'direct' ]; then
    echo "Direct connection selected. No VPN action will be taken."
else
    echo "Unsupported REMOTE_VPN_TYPE: $REMOTE_VPN_TYPE"
    exit 1
fi