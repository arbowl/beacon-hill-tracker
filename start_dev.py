#!/usr/bin/env python3
"""
Development startup script for the Beacon Hill Compliance Dashboard
Installs dependencies and starts both backend and frontend servers
"""

import os
import sys
import subprocess
import time
from pathlib import Path

def run_command(command, cwd=None, check=True):
    """Run a command and handle errors gracefully"""
    print(f"Running: {command}")
    try:
        result = subprocess.run(command, shell=True, cwd=cwd, check=check, 
                              capture_output=True, text=True)
        if result.stdout:
            print(result.stdout)
        return result
    except subprocess.CalledProcessError as e:
        print(f"Error running command: {command}")
        print(f"Exit code: {e.returncode}")
        if e.stdout:
            print(f"Stdout: {e.stdout}")
        if e.stderr:
            print(f"Stderr: {e.stderr}")
        return None

def check_python():
    """Check if Python 3.7+ is available"""
    try:
        result = subprocess.run([sys.executable, "--version"], capture_output=True, text=True)
        version = result.stdout.strip()
        print(f"Using Python: {version}")
        return True
    except Exception as e:
        print(f"Python check failed: {e}")
        return False

def check_node():
    """Check if Node.js is available"""
    try:
        result = subprocess.run(["node", "--version"], capture_output=True, text=True)
        version = result.stdout.strip()
        print(f"Node.js version: {version}")
        return True
    except FileNotFoundError:
        print("Node.js not found. Please install Node.js 16+ to run the frontend.")
        return False

def setup_backend():
    """Set up the backend environment"""
    print("\n=== Setting up Backend ===")
    
    # Check if virtual environment exists
    venv_path = Path("venv")
    if not venv_path.exists():
        print("Creating virtual environment...")
        run_command(f"{sys.executable} -m venv venv")
    
    # Activate virtual environment and install dependencies
    if os.name == 'nt':  # Windows
        pip_path = "venv\\Scripts\\pip"
        python_path = "venv\\Scripts\\python"
    else:  # Unix/Linux/macOS
        pip_path = "venv/bin/pip"
        python_path = "venv/bin/python"
    
    print("Installing backend dependencies...")
    run_command(f"{pip_path} install -r backend/requirements.txt")
    
    # Check if .env file exists
    env_file = Path("backend/.env")
    if not env_file.exists():
        print("Creating .env file from template...")
        env_example = Path("backend/env.example")
        if env_example.exists():
            with open(env_example) as f:
                content = f.read()
            with open(env_file, 'w') as f:
                f.write(content)
            print("Please edit backend/.env with your configuration before running the app.")
        else:
            print("Warning: No .env template found. You may need to create backend/.env manually.")
    
    return python_path

def setup_frontend():
    """Set up the frontend environment"""
    print("\n=== Setting up Frontend ===")
    
    if not check_node():
        return False
    
    # Install frontend dependencies
    frontend_path = Path("frontend")
    if not frontend_path.exists():
        print("Frontend directory not found!")
        return False
    
    print("Installing frontend dependencies...")
    result = run_command("npm install", cwd="frontend", check=False)
    if result is None or result.returncode != 0:
        print("npm install failed. Trying with --legacy-peer-deps...")
        result = run_command("npm install --legacy-peer-deps", cwd="frontend", check=False)
        if result is None or result.returncode != 0:
            print("Frontend dependency installation failed.")
            return False
    
    return True

def start_servers(python_path):
    """Start both backend and frontend servers"""
    print("\n=== Starting Servers ===")
    
    # Start backend server
    print("Starting backend server...")
    backend_env = os.environ.copy()
    backend_env['PYTHONPATH'] = str(Path.cwd())
    
    backend_process = subprocess.Popen(
        [python_path, "backend/app.py"],
        env=backend_env,
        cwd=Path.cwd()
    )
    
    # Give backend time to start
    print("Waiting for backend to start...")
    time.sleep(3)
    
    # Start frontend server
    print("Starting frontend server...")
    frontend_process = subprocess.Popen(
        ["npm", "run", "dev"],
        cwd="frontend"
    )
    
    print("\n" + "="*50)
    print("🎉 SERVERS STARTED SUCCESSFULLY!")
    print("="*50)
    print(f"Backend:  http://localhost:5000")
    print(f"Frontend: http://localhost:5173")
    print(f"Health:   http://localhost:5000/health")
    print("="*50)
    print("\nPress Ctrl+C to stop both servers")
    
    try:
        # Wait for both processes
        backend_process.wait()
        frontend_process.wait()
    except KeyboardInterrupt:
        print("\n\nShutting down servers...")
        backend_process.terminate()
        frontend_process.terminate()
        
        # Wait for graceful shutdown
        try:
            backend_process.wait(timeout=5)
            frontend_process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            backend_process.kill()
            frontend_process.kill()
        
        print("Servers stopped.")

def main():
    """Main startup function"""
    print("🚀 Beacon Hill Compliance Dashboard - Development Setup")
    print("="*55)
    
    # Check prerequisites
    if not check_python():
        sys.exit(1)
    
    # Setup backend
    python_path = setup_backend()
    
    # Setup frontend
    if not setup_frontend():
        print("\nFrontend setup failed, but backend can still run.")
        print("You can start the backend only with:")
        print(f"  {python_path} backend/app.py")
        sys.exit(1)
    
    # Start both servers
    start_servers(python_path)

if __name__ == "__main__":
    main()
