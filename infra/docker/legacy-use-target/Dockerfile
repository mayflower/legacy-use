FROM docker.io/ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive
ENV DEBIAN_PRIORITY=high

RUN apt-get update && \
    apt-get -y upgrade && \
    apt-get install -y --no-install-recommends \
    git \
    curl \
    wget \
    gnupg \
    # UI Requirements
    xvfb \
    xdotool \
    scrot \
    sudo \
    x11vnc \
    autocutsel \
    # Network tools
    net-tools \
    netcat-openbsd \
    iputils-ping \
    openvpn \
    golang  \
    proxychains \
    # Remote clients
    freerdp2-x11 \
    tigervnc-viewer \    

    # Python
    python3 \
    python3-pip \
    python3-venv \
    tightvncserver && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    rm -rf /tmp/* /var/tmp/*


# Install noVNC
RUN git clone --branch v1.5.0 https://github.com/novnc/noVNC.git /opt/noVNC && \
    git clone --branch v0.12.0 https://github.com/novnc/websockify /opt/noVNC/utils/websockify && \
    ln -s /opt/noVNC/vnc.html /opt/noVNC/index.html

# setup user
ENV USERNAME=legacy-use
ENV HOME=/home/$USERNAME
RUN useradd -m -s /bin/bash -d $HOME $USERNAME && \
    echo "${USERNAME} ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers && \
    mkdir -p $HOME/.cache $HOME/go && \
    chown -R $USERNAME:$USERNAME $HOME/.cache $HOME/go
USER legacy-use
WORKDIR $HOME



# Install wireproxy
RUN go install github.com/pufferffish/wireproxy/cmd/wireproxy@v1.0.9
# Copy SOCKS proxy server script
COPY infra/docker/legacy-use-target/image/socks_proxy.py /socks_proxy.py
RUN curl -fsSL https://tailscale.com/install.sh | sh

#RUN wget https://download.teamviewer.com/download/linux/teamviewer_arm64.deb && sudo apt install -y ./teamviewer_arm64.deb && rm teamviewer_arm64.deb



# Copy requirements.txt and install dependencies
COPY --chown=$USERNAME:$USERNAME infra/docker/legacy-use-target/requirements.txt $HOME/
# Create virtual environment
RUN python3 -m venv .venv
RUN .venv/bin/pip3 install -r requirements.txt


# setup desktop env & app
COPY --chown=$USERNAME:$USERNAME infra/docker/legacy-use-target/image/proxychains.conf /etc/proxychains.conf
COPY --chown=$USERNAME:$USERNAME infra/docker/legacy-use-target/image/ $HOME



ARG HOST_IP=unknown
ARG HOST_PORT=unknown
ARG REMOTE_USERNAME=unknown
ARG REMOTE_PASSWORD=unknown
ARG REMOTE_CLIENT_TYPE=unknown
ARG REMOTE_VPN_TYPE=unknown
ARG VPN_CONFIG=unknown
ARG VPN_USERNAME=unknown
ARG VPN_PASSWORD=unknown
ARG DISPLAY_NUM=1
ARG HEIGHT=768
ARG WIDTH=1024


ENV DISPLAY_NUM=$DISPLAY_NUM
ENV HEIGHT=$HEIGHT
ENV WIDTH=$WIDTH
ENV VPN_CONFIG=$VPN_CONFIG
ENV VPN_USERNAME=$VPN_USERNAME
ENV VPN_PASSWORD=$VPN_PASSWORD
ENV REMOTE_PASSWORD=$REMOTE_PASSWORD
ENV REMOTE_USERNAME=$REMOTE_USERNAME
ENV REMOTE_CLIENT_TYPE=$REMOTE_CLIENT_TYPE
ENV REMOTE_VPN_TYPE=$REMOTE_VPN_TYPE
ENV HOST_PORT=$HOST_PORT
ENV HOST_IP=$HOST_IP

ENTRYPOINT [ "./entrypoint.sh" ]
