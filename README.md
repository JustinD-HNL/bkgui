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
1. Clone or download this repository
2. Install dependencies: `npm install`
3. **Set up Firebase Authentication**:
   - Follow the guide in [FIREBASE_SETUP.md](FIREBASE_SETUP.md)
   - Copy `firebase-config.template.js` to `firebase-config.js`
   - Update the configuration with your Firebase project settings
4. Start local server: `npm start`
5. Open `http://localhost:8080` in your browser

### Cloud Deployment (Google Cloud Run)
1. **Quick Deploy**: Edit `deploy.sh` with your GCP Project ID and run `./deploy.sh`
   - The script will prompt you for Firebase configuration during deployment
2. **Manual Deploy**: Follow the detailed steps in [DEPLOYMENT.md](DEPLOYMENT.md)
3. **CI/CD**: Connect your repository to Google Cloud Build for automatic deployments

For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).
For Firebase setup instructions, see [FIREBASE_SETUP.md](FIREBASE_SETUP.md).

## 🔐 Authentication

The application uses Firebase Authentication with Google Sign-In to secure access and provide user management.

### Features
- **Google Sign-In**: One-click authentication with Google accounts
- **Session Persistence**: Users stay logged in across browser sessions
- **Secure Configuration**: Firebase config is handled securely via environment variables
- **Clean Interface**: Simple, modern authentication with minimal friction

### User Experience
- **One-Click Sign-In**: Single Google button for authentication
- **Automatic Redirect**: Seamless transition to the main app after login
- **User Profile Display**: Shows user avatar and email in the header
- **Responsive Design**: Works perfectly on all device sizes
- **Loading States**: Clear visual feedback during authentication

### Security
- **Google OAuth 2.0**: Leverages Google's secure authentication infrastructure
- **No Password Storage**: No sensitive credentials stored in the application
- **Domain Restrictions**: API keys are restricted to specific authorized domains
- **Environment Variables**: Firebase configuration protected in production

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
bkgui/
├── index.html              # Main application HTML
├── styles.css              # Application styles and themes
├── js/
│   ├── pipeline-builder.js # Core pipeline building logic
│   ├── yaml-generator.js   # YAML generation and validation
│   └── app.js              # Application utilities and features
├── server.js               # Express server for production
├── package.json            # Node.js dependencies
├── Dockerfile              # Container configuration
├── deploy.sh               # Quick deployment script
├── cloudbuild.yaml         # Google Cloud Build configuration
├── app.yaml                # Cloud Run service configuration
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
4. Test thoroughly
5. Submit a pull request

### Development

The application is built with vanilla JavaScript and requires no build process:

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
- [Buildkite GitHub Repository](https://github.com/buildkite)

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Support

- 🐛 Report bugs by creating GitHub issues
- 💡 Request features via GitHub discussions
- 📧 Contact: Open an issue for support

---

**Happy pipeline building!** 🚀
