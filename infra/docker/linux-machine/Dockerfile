# Use the Ubuntu desktop VNC image as base
FROM dorowu/ubuntu-desktop-lxde-vnc:focal

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive

# Fix GPG key issues and update package lists, then install GnuCash and screenshot tools
RUN apt-get update --allow-unauthenticated || true && \
    apt-get install -y --allow-unauthenticated gnupg2 wget && \
    wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add - && \
    apt-get update && \
    apt-get install -y \
    gnucash \
    gnucash-docs \
    gnome-screenshot \
    x11-utils \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory
WORKDIR /workspace

# Account Tree file will be mounted as a volume in docker-compose.yml

# Add GnuCash to supervisor services
COPY infra/docker/linux-machine/gnucash.conf /etc/supervisor/conf.d/gnucash.conf 