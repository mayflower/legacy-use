#!/bin/bash

# Configuration
PROJECT_NAME="legacy-use-core"
IMAGES=("backend" "frontend" "linux-machine" "target")
DOCKERHUB_USERNAME=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --username)
            DOCKERHUB_USERNAME="$2"
            shift 2
            ;;
        *)
            echo "Error: Unknown option $1"
            exit 1
            ;;
    esac
done

# Validate required parameters
if [ -z "$DOCKERHUB_USERNAME" ]; then
    echo "Error: Docker Hub username is required"
    echo "Usage: $0 --username your-dockerhub-username"
    exit 1
fi

echo "Creating Docker Hub deployment package..."

# Function to build images
build_images() {
    echo "Building latest Docker images..."
    docker compose build

    # Also build the target image specifically since it's not part of regular compose services
    echo "Building target image..."
    docker build -t legacy-use-core-target:latest -f infra/docker/legacy-use-target/Dockerfile .
}

# Function to push images to Docker Hub
push_to_dockerhub() {
    echo "Pushing images to Docker Hub (username: $DOCKERHUB_USERNAME)..."

    # Login to Docker Hub (will prompt for password if not logged in)
    if ! docker info | grep -q "Username.*$DOCKERHUB_USERNAME"; then
        echo "Logging into Docker Hub..."
        docker login
    fi

    # Tag and push each image
    for image in "${IMAGES[@]}"; do
        local_image="${PROJECT_NAME}-${image}:latest"
        hub_image="${DOCKERHUB_USERNAME}/${PROJECT_NAME}-${image}:latest"

        echo "Tagging and pushing ${image}..."
        docker tag "$local_image" "$hub_image"
        docker push "$hub_image"
    done

    echo "✓ All images pushed to Docker Hub"
}

# Function to create docker-compose.yml content
create_docker_compose_content() {
    local image_prefix="${DOCKERHUB_USERNAME}/"

    echo "# Docker Hub deployment - pulls latest images automatically"

cat << EOL
services:
  backend:
    image: ${image_prefix}${PROJECT_NAME}-backend:latest
    pull_policy: always
    container_name: legacy-use-backend
    user: root
    ports:
      - "8088:8088"
    env_file:
      - .env
    environment:
      - LEGACY_USE_DEBUG=\${LEGACY_USE_DEBUG:-1}
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    working_dir: /home/legacy-use-mgmt
    command: >
      bash -c "
        echo 'Running migrations' &&
        uv run alembic -c server/alembic.ini upgrade head &&
        echo 'Starting FastAPI server' &&
        if [ \"\\\${LEGACY_USE_DEBUG:-1}\" = \"1\" ]; then
          echo 'Debug mode enabled: Using hot reload' &&
          uv run uvicorn server.server:app --host 0.0.0.0 --port 8088 --reload --reload-dir server
        else
          echo 'Production mode: Using workers without reload' &&
          gunicorn -w 1 -k uvicorn.workers.UvicornH11Worker server.server:app --threads 4 --bind 0.0.0.0:8088
        fi
      "
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8088/docs"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - app-network

  frontend:
    image: ${image_prefix}${PROJECT_NAME}-frontend:latest
    pull_policy: always
    container_name: legacy-use-frontend
    ports:
      - "5173:5173"
    env_file:
      - .env
    environment:
      - VITE_API_URL=http://localhost:8088
      - LEGACY_USE_DEBUG=\${LEGACY_USE_DEBUG:-1}
      - BROWSER=none
    working_dir: /home/legacy-use-mgmt
    command: >
      bash -c "
        echo 'Starting React app' &&
        npm start
      "
    depends_on:
      backend:
        condition: service_healthy
    networks:
      - app-network

  linux-machine:
    image: ${image_prefix}${PROJECT_NAME}-linux-machine:latest
    pull_policy: always
    container_name: legacy-use-linux
    ports:
      - "6080:80"      # VNC web interface
      - "5900:5900"    # VNC direct connection
      - "2222:22"      # SSH access
    environment:
      - VNC_PASSWORD=password123
      - USER=developer
      - PASSWORD=developer123
      - RESOLUTION=1024x768
    volumes:
      - linux-home:/home/developer
      - linux-workspace:/workspace
      - /dev/shm:/dev/shm      # Required for VNC performance
      - ./data.qif:/workspace/data.qif:ro
      - ./data.gnucash:/workspace/data.gnucash:ro
    working_dir: /workspace
    networks:
      app-network:
        ipv4_address: 172.21.0.5    # Static IP assignment
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/"]
      interval: 30s
      timeout: 10s
      retries: 3

  target-image-setup:
    image: ${image_prefix}${PROJECT_NAME}-target:latest
    pull_policy: always
    container_name: legacy-use-target-setup
    command: >
      bash -c "
        echo 'Target image pulled and available for dynamic container launches' &&
        sleep 5
      "
    restart: "no"
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.21.0.0/16

volumes:
  linux-home:
  linux-workspace:
EOL
}

# Function to create startup scripts
create_startup_scripts() {
    # Create macOS/Linux startup script
    cat > startup.command << EOL
#!/bin/bash

# Change to the script's directory so it works when double-clicked
cd "\$(dirname "\$0")"

# Colors for pretty output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "\${BLUE}Starting Legacy Use deployment...\${NC}"

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo -e "\${YELLOW}Docker is not running. Please start Docker and try again.\${NC}"
    echo "Press any key to exit..."
    read -n 1
    exit 1
fi

# Pull latest images from Docker Hub
echo -e "\${BLUE}Pulling latest images...\${NC}"
docker compose pull

# Tag the target image so it's available for dynamic container launches
echo -e "\${BLUE}Setting up target image for dynamic launches...\${NC}"
docker tag \$(docker compose config | grep "image.*target" | awk '{print \$2}') legacy-use-target:local

# Start the application
echo -e "\${BLUE}Starting services...\${NC}"
docker compose down 2>/dev/null  # Clean shutdown if already running
docker compose up -d

# Wait for services to be healthy
echo -e "\${BLUE}Waiting for services to be ready...\${NC}"
sleep 5

# Check if services are running
if docker compose ps --format json | grep -q "running"; then
    echo -e "\${GREEN}Legacy Use is now running!\${NC}"
    echo -e "\nAccess points:"
    echo -e "\${BLUE}Frontend:\${NC} http://localhost:5173"
    echo -e "\${BLUE}API Documentation:\${NC} http://localhost:8088/docs"
    echo -e "\${BLUE}Linux Machine (VNC):\${NC} http://localhost:6080"
    echo ""
    echo "Opening the application in your browser..."

    # Open the frontend in the browser
    if command -v open >/dev/null 2>&1; then
        open http://localhost:5173/targets?startup
    elif command -v xdg-open >/dev/null 2>&1; then
        xdg-open http://localhost:5173/targets?startup
    else
        echo "Please open http://localhost:5173/targets?startup in your browser"
    fi

    echo ""
    echo -e "\${GREEN}Setup complete! The terminal will close in 10 seconds...\${NC}"
    echo "To stop the application later, run: docker compose down"
    sleep 10
else
    echo -e "\${YELLOW}Error: Some services failed to start. Check logs with: docker compose logs\${NC}"
    echo "Press any key to exit..."
    read -n 1
    exit 1
fi
EOL

    # Make startup script executable
    chmod +x startup.command

    # Create Windows startup script
    cat > startup.bat << EOL
@echo off
setlocal enabledelayedexpansion

:: Change to the script's directory so it works when double-clicked
cd /d "%~dp0"

echo Starting Legacy Use deployment...

:: Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo Docker is not running. Please start Docker Desktop and try again.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

:: Pull latest images from Docker Hub
echo Pulling latest images...
docker compose pull

:: Tag the target image so it's available for dynamic container launches
echo Setting up target image for dynamic launches...
for /f "tokens=2" %%i in ('docker compose config ^| findstr "image.*target"') do docker tag %%i legacy-use-target:local

:: Start the application
echo Starting services...
docker compose down >nul 2>&1
docker compose up -d

:: Wait for services to be healthy
echo Waiting for services to be ready...
timeout /t 5 /nobreak >nul

:: Check if services are running
docker compose ps --format json | findstr "running" >nul
if errorlevel 1 (
    echo Error: Some services failed to start. Check logs with: docker compose logs
    echo Press any key to exit...
    pause >nul
    exit /b 1
) else (
    echo Legacy Use is now running!
    echo.
    echo Access points:
    echo Frontend: http://localhost:5173
    echo API Documentation: http://localhost:8088/docs
    echo Linux Machine [VNC]: http://localhost:6080
    echo.
    echo Opening the application in your browser...

    :: Open the frontend in the browser
    start http://localhost:5173/targets?startup

    echo.
    echo Setup complete! This window will close in 10 seconds...
    echo To stop the application later, run: docker compose down
    timeout /t 10 /nobreak >nul
)
EOL
}

# Function to create deployment package
create_deployment_package() {
    local deployment_dir="$1"

    echo "Creating Docker Hub deployment package..."

    # Create docker-compose.yml
    create_docker_compose_content > "$deployment_dir/docker-compose.yml"

    # Copy common files
    cp .env "$deployment_dir/"
    cp infra/docker/linux-machine/data.qif "$deployment_dir/"
    cp infra/docker/linux-machine/data.gnucash "$deployment_dir/"

    # Create startup scripts
    cd "$deployment_dir"
    create_startup_scripts
    cd - > /dev/null

    # Create README
    cat > "$deployment_dir/README.md" << 'EOL'
# Legacy Use Application

This package provides everything you need to quickly set up and try the Legacy Use application.

---

## Quick Start

1. **Prerequisites**:

   * Ensure [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/) are installed.
   * Ensure you have an internet connection to pull the latest images from Docker Hub.

2. **Run the application**:

   **macOS/Linux (Double-click)**
   Simply double-click the `startup.command` file to launch the application.

   **Windows (Double-click)**
   Simply double-click the `startup.bat` file to launch the application.

**What this script does:**

- **Pulls** the latest Docker images from Docker Hub.
- **Starts** all required services.
- **Automatically opens** the frontend in your browser.
- If prompted for an **API key**, you can use the following:
    - dzlkpkzhdtlxtdjjiyexwqquqcchwspc

---

## Usage Guide

Upon launching the application, your browser will open to the **Targets** page, displaying a preconfigured Linux machine running a VNC server.

### Explore and Try Out APIs

1. Navigate to the **APIs** tab located in the top navigation bar.
2. Here, you'll find two predefined APIs.
3. Click **Select Target** and choose `compose`.
4. Select any of the APIs and click **Execute** to test their functionality.
5. When executing an API, a window will open allowing you to watch the execution of Legacy Use.

### Add your own Targets

1. Navigate to the **Targets** tab located in the top navigation bar.
2. Click **Add Target** and fill in the form.
  - You will need to provide the ip of the target machine.
    - Depending on your setup, you can use the local ip, which can be found by running the following command:
      - Windows: `ipconfig` -> `IPv4 Address`
      - Linux: `hostname -I`
      - Mac: `ipconfig getifaddr en0`
  - Also note that you will need to have a VNC server running on the target machine.
3. Click **Save** to add the target.
4. Select your newly added target when executing an API.

---

## Telemetry

By default, Legacy use sends telemetry data to Posthog. This is used to improve the product and to help us understand how the product is used. No data from external sources like your API keys or target machine data is sent.

You can opt out of telemetry by setting the `VITE_PUBLIC_DISABLE_TRACKING` environment variable to `true`. This is done in the `.env` file. If you can't see the file on Mac, press `Cmd + Shift + .` to show hidden files.

```bash
VITE_PUBLIC_DISABLE_TRACKING=true
```
EOL

# TODO: READD THIS AFTER WE ARE OPEN SOURCE, SINCE THE CODE IS NOT PUBLIC YET
# We want to be super transparent about this and you can find the exact data we collect here:

# - [./app/src/index.js](./app/src/index.js)
# - [./app/src/services/telemetryService.js](./app/src/services/telemetryService.js)
# - [./server/server.py](./server/server.py)
# - [./server/utils/telemetry.py](./server/utils/telemetry.py)


    echo "✓ Docker Hub deployment package created in $deployment_dir/"
}

# Main execution
build_images

# Create build directory structure
BUILD_DIR="build"
DEPLOYMENT_DIR="$BUILD_DIR/dockerhub"

rm -rf "$BUILD_DIR"
mkdir -p "$DEPLOYMENT_DIR"

# Push to Docker Hub
push_to_dockerhub

# Create deployment package
create_deployment_package "$DEPLOYMENT_DIR"

# Generate PDF from README if pandoc is available
echo "Generating PDF documentation..."
if command -v pandoc >/dev/null 2>&1; then
    echo "Converting README to PDF..."
    # Ensure TeX binaries are in PATH
    export PATH="/Library/TeX/texbin:$PATH"

    # Generate PDF
    pandoc "$DEPLOYMENT_DIR/README.md" \
        --pdf-engine=pdflatex \
        --variable=geometry:margin=1in \
        --variable=fontsize:11pt \
        --toc \
        --toc-depth=2 \
        -o "$DEPLOYMENT_DIR/README.pdf"

    if [ -f "$DEPLOYMENT_DIR/README.pdf" ]; then
        echo "✓ PDF documentation created: $DEPLOYMENT_DIR/README.pdf"
    else
        echo "⚠ PDF generation failed"
    fi
else
    echo "⚠ Pandoc not found. Skipping PDF generation."
    echo "To generate PDF documentation, install:"
    echo "  macOS: brew install pandoc && brew install --cask basictex"
    echo "  Ubuntu/Debian: sudo apt-get install pandoc texlive-latex-base"
    echo "  Windows: Download from https://pandoc.org/installing.html and install MiKTeX"
fi

# Create deployment package
echo "Creating deployment package..."

cd "$DEPLOYMENT_DIR"
zip -r ../legacy-use-beta.zip ./* .env
cd ../..

echo "✓ Docker Hub deployment package created: $BUILD_DIR/legacy-use-beta.zip"
echo ""
echo "Summary:"
echo "- Docker Hub package: Always pulls latest images from Docker Hub"
echo "- Requires internet connection for initial setup and updates"
echo ""
echo "To update Docker Hub images in the future, just run this script again!"

# TODO: Way better explanation of how to add targets
# TODO: Hint that some storage space is needed
# TODO: Explanation of what the different tabs are

# TODO: Test on Windows
# TODO: Include API key when opening the frontend (or just tell the user)
# TODO: Check if reopening works with handling still running docker containers
# TODO: Reduce redundancy between TUTORIAL.md and this README
# TODO: Reduce redundancy between startup.command and startup.bat
# TODO: Reduce redundancy between the mgmt and Backend/Frontend docker files
