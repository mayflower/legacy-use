# Docker Beta Build Setup

## Prerequisites
- Docker and Docker Compose installed
- Docker Hub account
- Logged into Docker Hub (`docker login`)

## Building the Beta Release

1. **Run the build script:**
   ```bash
   ./build-docker-beta.sh --username YOUR_DOCKERHUB_USERNAME
   ```
   Replace `YOUR_DOCKERHUB_USERNAME` with your actual Docker Hub username.

2. **What this does:**
   - Builds all Docker images (backend, frontend, linux-machine, target)
   - Pushes images to your Docker Hub account
   - Creates a deployment package in `build/dockerhub/`
   - Generates `build/legacy-use-beta.zip` - ready to distribute

## Using the Result

The script creates `build/legacy-use-beta.zip` containing:
- `docker-compose.yml` - Pre-configured to pull from Docker Hub
- `startup.command` (Mac/Linux) and `startup.bat` (Windows) - Double-click to run
- `.env` file with configuration
- `README.md` with user instructions

**To distribute:** Simply share the `legacy-use-beta.zip` file. Users can:
1. Extract the zip
2. Double-click the startup script for their OS
3. The app will automatically start at `http://localhost:5173`

## Updating Images

To push updated images to Docker Hub, just run the build script again with the same username.
