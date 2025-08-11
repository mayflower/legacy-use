#!/bin/bash

# Determine the proxy command based on REMOTE_VPN_TYPE
PROXY_CMD=""
if [ "$REMOTE_VPN_TYPE" != 'direct' ]; then
    PROXY_CMD="proxychains"
fi

if [ "$REMOTE_CLIENT_TYPE" = 'rdp' ]; then
    echo "Starting RDP connection..."

    # Set keyboard layout with proper error handling
    setxkbmap de -option "" 2>/dev/null || {
        echo "Warning: Could not set keyboard layout to 'de', using default"
        setxkbmap us 2>/dev/null || true
    }

    while true; do
        # Build argv as array; no quotes after the colon
        ARGS=(/u:${REMOTE_USERNAME} /p:${REMOTE_PASSWORD} /v:${HOST_IP}:${HOST_PORT})

        if [ -n "${RDP_PARAMS}" ]; then
            # Parse RDP_PARAMS handling both quoted and unquoted parameters safely
            echo "Parsing RDP_PARAMS: ${RDP_PARAMS}"

            # Use eval with array assignment to properly handle quoted strings
            # This is safe because we control the input and only use it for array assignment
            declare -a EXTRA=()
            eval "EXTRA=(${RDP_PARAMS})"

            ARGS+=("${EXTRA[@]}")
            echo "Parsed RDP parameters: ${EXTRA[@]}"
        else
            ARGS+=(/f +auto-reconnect +clipboard /cert:ignore)
        fi

        echo "ARGS: ${ARGS[@]}"

        $PROXY_CMD xfreerdp3 "${ARGS[@]}"

        echo "RDP connection failed, retrying in 3 sec..."
        sleep 3
    done
elif [ "$REMOTE_CLIENT_TYPE" = 'vnc' ]; then
    echo "Starting VNC connection..."
    mkdir ~/.vnc
    vncpasswd -f > ~/.vnc/passwd <<EOF
${REMOTE_PASSWORD}
${REMOTE_PASSWORD}
EOF
    chmod 600 ~/.vnc/passwd
    while true; do
        $PROXY_CMD xtigervncviewer -FullScreen -MenuKey=none -passwd ~/.vnc/passwd -ReconnectOnError=0 -AlertOnFatalError=0 ${HOST_IP}:${HOST_PORT}
        echo "VNC connection failed, retrying in 5 secs..."
        sleep 1  # wait before retrying in case of a crash or error
    done
elif [ "$REMOTE_CLIENT_TYPE" = 'teamviewer' ]; then
    echo "Teamviewer not supported yet"
    exit 1
else
    echo "Unsupported REMOTE_CLIENT_TYPE: $REMOTE_CLIENT_TYPE"
    exit 1
fi


# Notes about previous attempts have been moved to the troubleshooting guide.
