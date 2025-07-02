FROM python:3.11-slim

ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1

# Install system dependencies
RUN apt-get update && \
    apt-get install -y \
    curl \
    sqlite3 \
    ca-certificates \
    gnupg \
    software-properties-common \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Docker CLI (needed for dynamic container management)
RUN install -m 0755 -d /etc/apt/keyrings && \
    curl -fsSL https://download.docker.com/linux/debian/gpg | tee /etc/apt/keyrings/docker.asc > /dev/null && \
    chmod a+r /etc/apt/keyrings/docker.asc && \
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null && \
    apt-get update && \
    apt-get install -y docker-ce-cli && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Create user
ENV USERNAME=legacy-use-mgmt
ENV HOME=/home/$USERNAME
RUN useradd -m -s /bin/bash -d $HOME $USERNAME && \
    groupadd -f docker && \
    usermod -aG docker $USERNAME

USER $USERNAME
WORKDIR $HOME

# Copy and install Python requirements with uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/
COPY --chown=$USERNAME:$USERNAME pyproject.toml uv.lock $HOME/
RUN uv sync --locked

# Copy backend application code
COPY --chown=$USERNAME:$USERNAME server/ $HOME/server/

# Create entrypoint script
RUN echo '#!/bin/bash\n\
set -e\n\
\n\
echo "Running migrations"\n\
uv run alembic -c server/alembic.ini upgrade head\n\
\n\
echo "Starting FastAPI server"\n\
FASTAPI_SERVER_PORT=8088\n\
\n\
# Check if debug mode is enabled\n\
if [ "${LEGACY_USE_DEBUG:-0}" = "1" ]; then\n\
    echo "Debug mode enabled: Using hot reload"\n\
    exec uv run uvicorn server.server:app --host 0.0.0.0 --port $FASTAPI_SERVER_PORT --reload --reload-dir server\n\
else\n\
    echo "Production mode: Using workers without reload"\n\
    exec gunicorn -w 1 -k uvicorn.workers.UvicornH11Worker server.server:app --threads 4 --bind 0.0.0.0:$FASTAPI_SERVER_PORT\n\
fi' > $HOME/entrypoint.sh && \
    chmod +x $HOME/entrypoint.sh

EXPOSE 8088

ENTRYPOINT ["./entrypoint.sh"]
