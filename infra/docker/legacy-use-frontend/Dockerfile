# Multi-stage build for frontend optimization
FROM node:18-slim as builder

ENV DEBIAN_FRONTEND=noninteractive

# Install build dependencies
RUN apt-get update && \
    apt-get install -y \
    curl \
    ca-certificates \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create user
ENV USERNAME=legacy-use-mgmt
ENV HOME=/home/$USERNAME
RUN useradd -m -s /bin/bash -d $HOME $USERNAME

USER $USERNAME
WORKDIR $HOME

# Copy package files first for better layer caching
COPY --chown=$USERNAME:$USERNAME app/package*.json $HOME/app/

# Install all dependencies (including dev dependencies for building)
RUN cd $HOME/app && npm ci && npm cache clean --force

# Copy source code
COPY --chown=$USERNAME:$USERNAME app/ $HOME/app/

# Final runtime stage
FROM node:18-slim

ENV DEBIAN_FRONTEND=noninteractive

# Install runtime dependencies
RUN apt-get update && \
    apt-get install -y \
    curl \
    ca-certificates \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create user
ENV USERNAME=legacy-use-mgmt
ENV HOME=/home/$USERNAME
RUN useradd -m -s /bin/bash -d $HOME $USERNAME

USER $USERNAME
WORKDIR $HOME

# Copy only the built application from builder stage
COPY --from=builder --chown=$USERNAME:$USERNAME $HOME/app $HOME/app

# Create entrypoint script
RUN echo '#!/bin/bash\n\
set -e\n\
\n\
echo "Starting React app"\n\
\n\
# Check if debug mode is enabled\n\
if [ "${LEGACY_USE_DEBUG:-0}" = "1" ]; then\n\
    echo "Debug mode: Installing/updating node dependencies"\n\
    npm install && npm cache clean --force\n\
fi\n\
\n\
echo "Starting development server"\n\
exec npm start' > $HOME/entrypoint.sh && \
    chmod +x $HOME/entrypoint.sh

EXPOSE 5173

ENTRYPOINT ["./entrypoint.sh"]
