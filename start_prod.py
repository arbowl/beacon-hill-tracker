#!/usr/bin/env python3
"""
Production startup script for Render deployment
Sets up databases and starts the Flask application
"""

import os
import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent / 'backend'
sys.path.insert(0, str(backend_dir))

def main():
    """Main production startup"""
    print("🚀 Beacon Hill Compliance Tracker - Production Startup")
    print("=" * 55)
    
    # Import and create the Flask app (this initializes databases automatically)
    try:
        from backend.app import create_app
        app = create_app()
        
        print("✅ Application initialized successfully")
        
        # Get port from environment (Render sets this)
        port = int(os.getenv('PORT', 5000))
        
        print(f"🌐 Starting server on port {port}")
        app.run(host='0.0.0.0', port=port, debug=False)
        
    except Exception as e:
        print(f"❌ Application startup failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
