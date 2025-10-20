# Supermarket POS - Frontend

React.js frontend application for Supermarket POS system.

## 🚀 Quick Start with Docker

### Prerequisites
- Docker and Docker Compose installed
- Backend API running on port 8087

### Running with Docker

1. **Build and run:**
```bash
docker build -t supermarket-pos-frontend .
docker run -p 3001:80 supermarket-pos-frontend
```

2. **Or use with docker-compose:**
```bash
# From the main project directory
docker-compose up frontend
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `/api` | API base URL for Docker environment |

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### API Configuration

The frontend communicates with the backend through nginx proxy:
- Development: `http://localhost:5173` → `http://localhost:8087/api/v1.0`
- Docker: `http://localhost:3001/api` → `http://backend:8087/api/v1.0`

## 📦 Docker Image

The Docker image is available on Docker Hub:
```bash
docker pull antonalmishev/supermarket-pos-frontend:latest
```

## 🎨 Features

- **Modern UI** with Bootstrap and custom styling
- **Responsive Design** for different screen sizes
- **Real-time Updates** for inventory and orders
- **Barcode Scanning** support
- **Multi-language** support (Bulgarian/English)
- **Role-based Access** (Admin/User)

## 🔧 Configuration

### Nginx Configuration
The application uses nginx to serve static files and proxy API requests:
- Static files served from `/usr/share/nginx/html`
- API requests proxied to backend service
- Gzip compression enabled
- Caching headers for static assets

### Build Process
- **Stage 1:** Node.js build environment
- **Stage 2:** Nginx production server
- **Multi-stage build** for optimized image size

## 📝 License

This project is proprietary software.