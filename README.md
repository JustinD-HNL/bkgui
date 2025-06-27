# Buildkite Pipeline Builder

A visual GUI application for creating and editing Buildkite CI/CD pipelines through an intuitive drag-and-drop interface.

## Features

🎯 **Visual Pipeline Building**
- Drag and drop step types to build pipelines
- Real-time visual feedback and step ordering
- Interactive step configuration

🛠️ **Comprehensive Step Support**
- Command Steps - Execute shell commands
- Wait Steps - Control pipeline flow
- Block Steps - Manual approval gates
- Input Steps - Collect user input
- Trigger Steps - Launch other pipelines
- Group Steps - Organize related steps

📋 **Smart Configuration**
- Property panels for detailed step configuration
- Real-time YAML generation and preview
- Pipeline validation and error checking

🚀 **Productivity Features**
- Example pipeline templates
- Keyboard shortcuts for quick actions
- Export/import pipeline configurations
- Auto-save functionality

## Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- For cloud deployment: Google Cloud account and gcloud CLI
- For authentication: Firebase project (see [FIREBASE_SETUP.md](FIREBASE_SETUP.md))

### Local Development
1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd buildkite-pipeline-builder
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase Authentication**:
   - Follow the guide in [FIREBASE_SETUP.md](FIREBASE_SETUP.md)
   - Copy `firebase-config.template.js` to `firebase-config.js`
   - Update the configuration with your Firebase project settings

4. **Start local server**
   ```bash
   npm start
   ```

5. **Open in browser**
   ```
   http://localhost:8080
   ```

### Cloud Deployment (Google Cloud Run)

#### Quick Deploy
1. **Edit deployment script**: Update `PROJECT_ID` in `deploy.sh`
2. **Run deployment**: `./deploy.sh`
   - The script will prompt you for Firebase configuration during deployment

#### Manual Deploy
Follow the detailed steps in [DEPLOYMENT.md](DEPLOYMENT.md)

#### CI/CD Setup
Connect your repository to Google Cloud Build for automatic deployments using the included `cloudbuild.yaml`

## 🔐 Authentication

The application uses Firebase Authentication with Google Sign-In to secure access and provide user management.

### Features
- **Google Sign-In**: One-click authentication with Google accounts
- **Session Persistence**: Users stay logged in across browser sessions
- **Secure Configuration**: Firebase config is handled securely via environment variables
- **Clean Interface**: Simple, modern authentication with minimal friction

### Setup Requirements
1. **Firebase Project**: Create a project at [Firebase Console](https://console.firebase.google.com/)
2. **Enable Google Auth**: Enable Google sign-in in Authentication settings
3. **Configure Domains**: Add your domain(s) to authorized domains
4. **Set Environment Variables**: Configure Firebase credentials for deployment

For detailed setup instructions, see [FIREBASE_SETUP.md](FIREBASE_SETUP.md).

## Troubleshooting

### Authentication Issues

If Firebase authentication is not working, use the built-in debug tool:

1. **Visit the debug page**: `http://your-domain/debug-auth.html`
2. **Run diagnostic tests**: The page will guide you through testing each component
3. **Check the issues below** for common problems

#### Common Issues & Solutions

**🚨 "Firebase configuration not available"**
- **Cause**: Missing environment variables or firebase-config.js
- **Solution**: 
  - For deployment: Set `FIREBASE_API_KEY` and other env vars in Cloud Run
  - For local: Create `firebase-config.js` with your Firebase project settings

**🚨 "This domain is not authorized"**
- **Cause**: Domain not added to Firebase authorized domains
- **Solution**: 
  1. Go to [Firebase Console](https://console.firebase.google.com/)
  2. Select your project → Authentication → Sign-in method
  3. Scroll to "Authorized domains" and add your domain

**🚨 "Pop-up blocked by browser"**
- **Cause**: Browser blocking the Google sign-in popup
- **Solution**: Allow popups for your domain in browser settings

**🚨 "Firebase SDK not loaded"**
- **Cause**: Network issues or CDN problems
- **Solution**: Check browser console for script loading errors

#### Debug Tools

1. **Built-in Debug Page**: Visit `/debug-auth.html` for comprehensive testing
2. **Browser Console**: Check for JavaScript errors and Firebase logs
3. **Server Debug**: Visit `/api/debug/firebase-status` for server-side status
4. **Health Check**: Visit `/health` to verify server is running

### Server Issues

**🚨 Server not starting**
```bash
# Check if port is in use
lsof -i :8080

# Start with debug logging
NODE_ENV=development npm start
```

**🚨 Environment variables not loading**
```bash
# Check current environment
curl http://localhost:8080/api/debug/firebase-status

# For Cloud Run deployment
gcloud run services describe buildkite-pipeline-builder \
  --region=us-central1 \
  --format="value(spec.template.spec.containers[0].env[].name,spec.template.spec.containers[0].env[].value)"
```

### Development Environment

**🚨 Local Firebase config not loading**
1. Ensure `firebase-config.js` exists and is properly formatted
2. Check that the file is not in `.gitignore`
3. Verify the config object is assigned to `window.FIREBASE_CONFIG`

**🚨 CORS errors in development**
- The server is configured to allow Firebase domains
- Check browser console for specific CORS errors
- Ensure you're accessing via `http://localhost:8080` (not file://)

## Usage

#### Basic Pipeline Creation
1. **Add Steps**: Drag step types from the left sidebar to the pipeline canvas
2. **Configure Steps**: Click on any step to edit its properties in the right panel
3. **Reorder Steps**: Use the arrow buttons or drag steps to reorder
4. **Export Pipeline**: Click "Export YAML" to generate the Buildkite pipeline configuration

#### Keyboard Shortcuts
- `Ctrl+S` (or `Cmd+S`) - Export YAML
- `Ctrl+N` (or `Cmd+N`) - Clear pipeline
- `Ctrl+E` (or `Cmd+E`) - Load example pipeline
- `Delete` - Remove selected step
- `Escape` - Deselect current step

#### Step Types

**Command Step**
- Execute shell commands, scripts, or tools
- Configure agent targeting, timeouts, and retry behavior
- Set environment variables and working directories

**Wait Step**
- Pause pipeline execution until all previous steps complete
- Control pipeline flow and dependencies

**Block Step**
- Require manual approval before continuing
- Ideal for deployment gates and review processes

**Input Step**
- Collect user input during pipeline execution
- Define custom form fields and validation

**Trigger Step**
- Launch other Buildkite pipelines
- Pass environment variables and build parameters

**Group Step**
- Organize related steps together
- Run steps in parallel or sequence

## Examples

### Basic CI Pipeline
```yaml
steps:
  - label: "Install Dependencies"
    command: "npm install"
    
  - label: "Run Tests"
    command: "npm test"
    
  - label: "Build Application"
    command: "npm run build"
```

### Deployment Pipeline with Approval
```yaml
steps:
  - label: "Run Tests"
    command: "npm test"
    
  - wait
  
  - block: "Deploy to Production"
    prompt: "Ready to deploy to production?"
    
  - label: "Deploy"
    command: "npm run deploy"
```

## File Structure

```
buildkite-pipeline-builder/
├── index.html              # Main application HTML
├── styles.css              # Application styles and themes
├── js/
│   ├── firebase-auth.js    # Firebase authentication service
│   ├── pipeline-builder.js # Core pipeline building logic
│   ├── yaml-generator.js   # YAML generation and validation
│   └── app.js              # Application utilities and features
├── server.js               # Express server for production
├── debug-auth.html         # Authentication debugging tool
├── package.json            # Node.js dependencies
├── Dockerfile              # Container configuration
├── deploy.sh               # Quick deployment script
├── cloudbuild.yaml         # Google Cloud Build configuration
├── DEPLOYMENT.md           # Detailed deployment guide
├── FIREBASE_SETUP.md       # Firebase setup instructions
└── README.md               # This documentation
```

## Browser Support

- ✅ Chrome 70+
- ✅ Firefox 65+
- ✅ Safari 12+
- ✅ Edge 79+

## Contributing

This is an open-source project! Contributions are welcome:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly (including authentication)
5. Submit a pull request

### Development

The application is built with vanilla JavaScript and requires no build process:

- `firebase-auth.js` - Firebase authentication handling with comprehensive error handling
- `pipeline-builder.js` - Core drag & drop and step management
- `yaml-generator.js` - Buildkite YAML generation
- `app.js` - Application features and utilities
- `styles.css` - Responsive design and theming

## Buildkite Integration

### Using Generated Pipelines

1. Export your pipeline as YAML
2. Save the YAML file in your repository (e.g., `.buildkite/pipeline.yml`)
3. Configure your Buildkite pipeline to use the file
4. Commit and push your changes

### Pipeline Upload

You can also upload pipelines directly using the Buildkite CLI:

```bash
buildkite-agent pipeline upload .buildkite/pipeline.yml
```

## Support & Debugging

### Getting Help

1. **Check the troubleshooting section** above for common issues
2. **Use the debug tool** at `/debug-auth.html` for authentication issues
3. **Check browser console** for JavaScript errors
4. **Review server logs** for backend issues

### Useful Debug URLs

- `/health` - Server health check
- `/debug-auth.html` - Authentication diagnostic tool
- `/api/debug/firebase-status` - Firebase configuration status
- `/api/firebase-config` - Firebase configuration endpoint

### Reporting Issues

When reporting issues, please include:

1. **Environment details** (browser, OS, deployment type)
2. **Error messages** from browser console
3. **Steps to reproduce** the issue
4. **Output from debug tools** if authentication-related

## Roadmap

🎯 **Planned Features**
- [ ] Pipeline templates library
- [ ] Step validation and linting
- [ ] Dark mode theme
- [ ] Pipeline import from existing YAML
- [ ] Step dependency visualization
- [ ] Plugin marketplace integration
- [ ] Team collaboration features

## Resources

- [Buildkite Documentation](https://buildkite.com/docs)
- [Buildkite Step Reference](https://buildkite.com/docs/pipelines/step-reference)
- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Support

- 🐛 Report bugs by creating GitHub issues
- 💡 Request features via GitHub discussions
- 📧 Contact: Open an issue for support

---

**Happy pipeline building!** 🚀