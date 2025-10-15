# Beacon Hill Compliance Dashboard

A comprehensive web dashboard for tracking legislative compliance with Massachusetts transparency requirements.

## Quick Start

### Prerequisites
- Python 3.7+
- Node.js 16+
- Git

### One-Command Setup

```bash
python start_dev.py
```

This will:
1. Create a Python virtual environment
2. Install all backend dependencies
3. Install all frontend dependencies  
4. Create a `.env` file from the template
5. Start both backend (Flask) and frontend (React) servers

**Servers will be available at:**
- Backend API: http://localhost:5000
- Frontend App: http://localhost:5173
- Health Check: http://localhost:5000/health

### Manual Setup (Alternative)

If you prefer to set up manually:

#### Backend Setup
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Unix/Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Copy environment template
cp backend/env.example backend/.env
# Edit backend/.env with your configuration

# Start backend server
python backend/app.py
```

#### Frontend Setup
```bash
# Install dependencies
cd frontend
npm install

# Start development server
npm run dev
```

## Project Structure

```
dashboard/
├── backend/                    # Flask API server
│   ├── app.py                 # Main application (integrated)
│   ├── auth_models.py         # User authentication models
│   ├── auth_routes.py         # Authentication endpoints
│   ├── views_routes.py        # Saved views endpoints
│   ├── keys_routes.py         # Signing keys endpoints
│   ├── email_service.py       # Email service
│   ├── security.py            # Security middleware
│   ├── requirements.txt       # Python dependencies
│   └── .env                   # Environment variables (create from env.example)
├── frontend/                  # React SPA
│   ├── src/
│   │   ├── components/        # Reusable React components
│   │   ├── pages/            # Page components
│   │   ├── services/         # API service layer
│   │   ├── hooks/            # Custom React hooks
│   │   ├── contexts/         # React contexts
│   │   └── types/            # TypeScript type definitions
│   ├── package.json          # Node.js dependencies
│   └── vite.config.ts        # Vite configuration
├── compliance_tracker.db     # Main SQLite database (auto-created)
├── auth.db                   # Authentication database (auto-created)
├── cache.json               # Existing compliance data
├── flask_app.py             # Original Flask app (preserved)
├── start_dev.py             # Development startup script
└── README.md                # This file
```

## Architecture

### Backend (Flask)
- **Authentication**: JWT-based with email verification
- **Database**: SQLite3 (main data + separate auth database)
- **Security**: CORS, rate limiting, input validation, security headers
- **Email**: Configurable SMTP for notifications

### Frontend (React + TypeScript)
- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS with DaisyUI components
- **Charts**: Plotly.js for data visualizations
- **Routing**: React Router DOM
- **State**: React Context + hooks

### User Roles
1. **Guest** (no login): View dashboard, export data
2. **User** (basic login): All Guest permissions + save custom views
3. **Privileged** (admin-assigned): All User permissions + generate signing keys
4. **Admin** (site owner): All permissions + user management

## Features

### Dashboard
- Interactive compliance statistics
- Committee and bill filtering
- Search functionality
- Data visualizations (Plotly charts)
- CSV export ("what you see is what you get")

### Authentication
- Email/password registration with verification
- JWT-based session management
- Role-based access control
- Password reset functionality

### Saved Views
- Save custom dashboard configurations
- Private views per user
- Search and manage saved views
- Duplicate existing views

### Signing Keys
- Generate cryptographic key pairs for privileged users
- Secure key storage and management
- Key revocation and regeneration
- Admin oversight of all keys

## API Endpoints

### Public Endpoints
- `GET /health` - Health check
- `GET /api/stats` - Global statistics
- `GET /api/committees` - Committee list
- `GET /api/bills` - Bills with filtering
- `POST /ingest` - Data ingestion (existing functionality)

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/verify-email` - Email verification
- `POST /auth/login` - User login
- `GET /auth/me` - Current user info
- `POST /auth/users/{id}/role` - Admin: Update user role

### Saved Views (Protected)
- `GET /views` - List user's saved views
- `POST /views` - Create new view
- `GET /views/{id}` - Get specific view
- `PUT /views/{id}` - Update view
- `DELETE /views/{id}` - Delete view

### Signing Keys (Privileged+)
- `GET /keys` - List user's keys
- `POST /keys/generate` - Generate new key pair
- `POST /keys/{id}/revoke` - Revoke key
- `GET /keys/verify/{key}` - Public key verification

## Configuration

Key environment variables in `backend/.env`:

```bash
# Security
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret

# Database
DATABASE_URL=sqlite:///compliance_tracker.db
AUTH_DATABASE_URL=sqlite:///auth.db

# Email (SMTP)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_DEFAULT_SENDER=your-email@gmail.com

# Application
FRONTEND_URL=http://localhost:5173
```

## Development

### Backend Development
```bash
# Activate virtual environment
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Install new dependencies
pip install package-name
pip freeze > backend/requirements.txt

# Run backend only
python backend/app.py
```

### Frontend Development
```bash
cd frontend

# Install new dependencies
npm install package-name

# Run frontend only
npm run dev

# Build for production
npm run build
```

### Database Management
The application automatically creates and manages SQLite databases:
- `compliance_tracker.db` - Main compliance data
- `auth.db` - User accounts, views, and keys

To inspect the databases, use any SQLite client or the command line:
```bash
sqlite3 compliance_tracker.db
sqlite3 auth.db
```

## Data Integration

The system supports the existing data ingestion workflow:

```bash
# Import cache data
curl -X POST http://localhost:5000/ingest \
  -H "Content-Type: application/json" \
  -d @cache.json

# Import compliance reports
curl -X POST "http://localhost:5000/ingest?committee_id=J10" \
  -H "Content-Type: application/json" \
  -d @out/basic_J10.json
```

## Production Deployment

1. **Environment**: Set production environment variables
2. **Database**: Consider PostgreSQL for better concurrency
3. **Web Server**: Use Gunicorn + Nginx for production
4. **Security**: Enable HTTPS, update CORS settings
5. **Email**: Configure production SMTP service

Example production startup:
```bash
# Backend
gunicorn -w 4 -b 0.0.0.0:5000 backend.app:app

# Frontend (build and serve)
cd frontend
npm run build
# Serve dist/ folder with nginx or similar
```

## Troubleshooting

### Backend Issues
- **Import errors**: Ensure virtual environment is activated
- **Database errors**: Check file permissions and disk space
- **Email errors**: Verify SMTP configuration in .env

### Frontend Issues
- **npm install fails**: Try `npm install --legacy-peer-deps`
- **Build errors**: Check Node.js version (16+ required)
- **API connection**: Verify backend is running on port 5000

### Common Issues
- **CORS errors**: Check FRONTEND_URL in backend/.env
- **Authentication fails**: Verify JWT_SECRET_KEY is set
- **Email not sending**: Check SMTP settings and firewall

## Contributing

1. Create a feature branch
2. Make changes with tests
3. Update documentation
4. Submit pull request

## License

[Add your license information here]

---

For detailed API documentation, see `API_GUIDE.md`.  
For database schema details, see `SCHEMA.md`.