# Buildkite Pipeline Builder

A powerful, visual GUI application for creating and managing Buildkite CI/CD pipelines. Build complex pipelines with drag-and-drop simplicity, advanced step configuration, and real-time YAML generation.

## ✨ Features

### Core Functionality
- **Visual Pipeline Builder**: Drag-and-drop interface for creating pipeline steps
- **Real-time YAML Generation**: See your pipeline YAML update as you build
- **Step Templates**: Pre-configured templates for common tasks
- **Plugin Catalog**: Browse and add popular Buildkite plugins
- **Matrix Builds**: Configure build matrices with live preview
- **YAML Validation**: Built-in validation and error checking
- **Export Options**: Download or copy pipeline YAML

### Advanced Features
- **Command Palette**: Quick access to all features with Ctrl+K
- **Keyboard Shortcuts**: Speed up your workflow with hotkeys
- **Auto-save**: Never lose your work with automatic saving
- **Step Dependencies**: Visual dependency management
- **Conditional Steps**: Configure steps with conditions
- **Environment Variables**: Manage pipeline and step-level variables
- **Plugin Configuration**: Visual plugin setup with validation

### User Experience
- **Modern Interface**: Clean, responsive design that works on all devices
- **No Authentication Required**: Start building immediately without sign-in
- **Fast Performance**: Built with vanilla JavaScript for speed
- **Accessibility**: Full keyboard navigation and screen reader support

## 🚀 Quick Start

### Option 1: Cloud Deployment (Recommended)

Deploy directly to Google Cloud Run:

```bash
git clone https://github.com/your-repo/buildkite-pipeline-builder.git
cd buildkite-pipeline-builder
./Docker/deploy.sh
```

The deployment script will:
- Build and push your Docker image
- Deploy to Google Cloud Run  
- Provide you with a live URL
- No authentication setup required

### Option 2: Local Development

Run locally for development:

```bash
# Clone the repository
git clone https://github.com/your-repo/buildkite-pipeline-builder.git
cd buildkite-pipeline-builder

# Install dependencies
npm install

# Start the server
npm start

# Open in browser
open http://localhost:8080
```

### Option 3: Docker

Run with Docker:

```bash
# Build the image
docker build -t buildkite-pipeline-builder .

# Run the container
docker run -p 8080:8080 buildkite-pipeline-builder

# Access the application
open http://localhost:8080
```

## 📋 Usage

### Building Your First Pipeline

1. **Add Steps**: Drag step types from the sidebar to the pipeline area
2. **Configure Steps**: Click on any step to configure its settings
3. **Add Dependencies**: Connect steps by configuring the `depends_on` field
4. **Use Plugins**: Browse the plugin catalog and add popular plugins
5. **Export YAML**: Click "Export YAML" to get your pipeline configuration

### Step Types

- **Command Step**: Execute shell commands and scripts
- **Wait Step**: Create dependencies between pipeline stages  
- **Block Step**: Add manual approval points
- **Input Step**: Collect user input during builds
- **Trigger Step**: Trigger other pipelines
- **Group Step**: Organize related steps

### Advanced Features

#### Matrix Builds
Configure matrix builds to run the same step with different parameters:
```yaml
matrix:
  - os: ["ubuntu", "windows", "macos"]
    node: ["16", "18", "20"]
```

#### Plugin Integration
Add popular plugins with visual configuration:
- Docker build and push
- Artifact upload/download  
- Test result annotations
- Slack notifications
- Security scanning

#### Command Palette
Press `Ctrl+K` (or `Cmd+K` on Mac) to open the command palette for quick access to:
- Add new steps
- Export pipeline
- Load templates
- Clear pipeline
- Show shortcuts

### Example Pipeline

```yaml
steps:
  - label: "🧪 Test"
    command: "npm test"
    
  - wait
  
  - label: "🚀 Deploy"
    command: "npm run deploy"
    depends_on: "test"
    if: build.branch == "main"
```

## 🛠 Development

### Project Structure

```
buildkite-pipeline-builder/
├── index.html              # Main application HTML
├── styles.css              # Application styles and themes
├── js/
│   ├── pipeline-builder.js # Core pipeline building logic
│   ├── yaml-generator.js   # YAML generation and validation
│   ├── firebase-auth.js    # Authentication service (disabled)
│   └── app.js              # Application utilities and features
├── server.js               # Express server for production
├── package.json            # Node.js dependencies
├── Dockerfile              # Container configuration
├── Docker/                 # Docker-related files
│   ├── deploy.sh           # Quick deployment script
│   ├── cloudbuild.yaml     # Google Cloud Build configuration
│   ├── set-firebase-config.sh # Firebase configuration script
│   └── supervisord.conf    # Supervisor configuration
├── DEPLOYMENT.md           # Detailed deployment guide
└── README.md               # This documentation
```

### Building Features

The application is built with vanilla JavaScript and requires no build process:

- `pipeline-builder.js` - Core drag & drop and step management
- `yaml-generator.js` - Buildkite YAML generation and validation  
- `firebase-auth.js` - Authentication service (currently disabled)
- `app.js` - Application features and utilities
- `styles.css` - Responsive design and theming

### Contributing

This is an open-source project! Contributions are welcome:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 🚀 Deployment

### Google Cloud Run (Recommended)

Use the included deployment script:

```bash
./Docker/deploy.sh
```

This will:
- Build your Docker image
- Push to Google Container Registry
- Deploy to Cloud Run
- Provide a public URL

### Manual Cloud Run Deployment

```bash
# Build and push image
docker build -t gcr.io/YOUR_PROJECT_ID/buildkite-pipeline-builder .
docker push gcr.io/YOUR_PROJECT_ID/buildkite-pipeline-builder

# Deploy to Cloud Run
gcloud run deploy buildkite-pipeline-builder \
  --image gcr.io/YOUR_PROJECT_ID/buildkite-pipeline-builder \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

### Environment Variables

The application runs without any required environment variables. Optional configuration:

- `NODE_ENV`: Set to `production` for production deployments
- `PORT`: Server port (defaults to 8080)

## 📖 Buildkite Integration

### Using Generated Pipelines

1. **Export your pipeline** as YAML from the application
2. **Save the YAML file** in your repository (e.g., `.buildkite/pipeline.yml`)  
3. **Configure your Buildkite pipeline** to use the file
4. **Commit and push** your changes

### Pipeline Upload

You can also upload pipelines directly using the Buildkite CLI:

```bash
buildkite-agent pipeline upload .buildkite/pipeline.yml
```

### Example Integration

Add this to your repository's `.buildkite/pipeline.yml`:

```yaml
steps:
  - label: "📦 Install"
    command: "npm ci"
    
  - label: "🧪 Test" 
    command: "npm test"
    depends_on: "install"
    
  - wait
  
  - label: "🚀 Deploy"
    command: "npm run deploy"
    if: build.branch == "main"
```

## 🔧 Troubleshooting

### Common Issues

**🚨 Server not starting**
```bash
# Check if port is in use
lsof -i :8080

# Start with debug logging
NODE_ENV=development npm start
```

**🚨 Docker build fails**
```bash
# Test locally first
docker build -t test-image .
docker run -p 8080:8080 test-image
```

**🚨 Cloud Run deployment fails**
```bash
# Check authentication
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

### Debug Endpoints

- `/health` - Server health check
- `/api/test` - API connectivity test

### Getting Help

1. **Check the troubleshooting section** above for common issues
2. **Check browser console** for JavaScript errors  
3. **Review server logs** for backend issues
4. **Open an issue** on GitHub with details

## 📱 Browser Support

- ✅ Chrome 70+
- ✅ Firefox 65+  
- ✅ Safari 12+
- ✅ Edge 79+

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

**Happy pipeline building!** 🎉 

Start creating powerful Buildkite pipelines with our visual builder today!