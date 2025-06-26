# Deployment Guide - Google Cloud Run

This guide will help you deploy the Buildkite Pipeline Builder to Google Cloud Run.

## Prerequisites

1. **Google Cloud Account**: You need a Google Cloud Project with billing enabled
2. **Google Cloud CLI**: Install the [gcloud CLI](https://cloud.google.com/sdk/docs/install)
3. **Docker**: Install [Docker Desktop](https://www.docker.com/products/docker-desktop/)

## Quick Deployment (Recommended)

### Step 1: Setup Google Cloud Project

1. Create a new project in [Google Cloud Console](https://console.cloud.google.com/)
2. Note your Project ID (you'll need it for deployment)
3. Enable billing for your project

### Step 2: Configure and Deploy

1. **Edit the deployment script**:
   ```bash
   nano deploy.sh
   ```
   
2. **Update the PROJECT_ID**:
   ```bash
   PROJECT_ID="your-actual-project-id"  # Replace with your GCP project ID
   ```

3. **Run the deployment script**:
   ```bash
   ./deploy.sh
   ```

The script will:
- Authenticate you with Google Cloud
- Enable required APIs
- Build and push the Docker image
- Deploy to Cloud Run
- Provide you with the live URL

### Step 3: Access Your Application

After successful deployment, you'll receive a URL like:
```
https://buildkite-pipeline-builder-[hash]-uc.a.run.app
```

## Alternative Deployment Methods

### Method 1: Using gcloud Commands Directly

1. **Build and submit to Cloud Build**:
   ```bash
   gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/buildkite-pipeline-builder
   ```

2. **Deploy to Cloud Run**:
   ```bash
   gcloud run deploy buildkite-pipeline-builder \
     --image gcr.io/YOUR_PROJECT_ID/buildkite-pipeline-builder \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated
   ```

### Method 2: Using Cloud Build for CI/CD

1. **Connect your repository** to Cloud Build in the Google Cloud Console

2. **Set up triggers** to automatically deploy on code changes

3. **The cloudbuild.yaml** file is already configured for automatic deployment

## Configuration Options

### Environment Variables

You can set environment variables during deployment:

```bash
gcloud run deploy buildkite-pipeline-builder \
  --image gcr.io/YOUR_PROJECT_ID/buildkite-pipeline-builder \
  --set-env-vars NODE_ENV=production,CUSTOM_VAR=value
```

### Resource Allocation

Adjust memory and CPU allocation:

```bash
gcloud run deploy buildkite-pipeline-builder \
  --image gcr.io/YOUR_PROJECT_ID/buildkite-pipeline-builder \
  --memory 1Gi \
  --cpu 2
```

### Custom Domain

To use a custom domain:

1. **Map your domain** in Cloud Run console
2. **Add DNS records** as instructed
3. **SSL certificates** are automatically provisioned

## Security Considerations

### Authentication (Optional)

By default, the service allows unauthenticated access. To require authentication:

```bash
gcloud run deploy buildkite-pipeline-builder \
  --image gcr.io/YOUR_PROJECT_ID/buildkite-pipeline-builder \
  --no-allow-unauthenticated
```

Then manage access with IAM:

```bash
gcloud run services add-iam-policy-binding buildkite-pipeline-builder \
  --member="user:user@example.com" \
  --role="roles/run.invoker" \
  --region=us-central1
```

### VPC Connector (Advanced)

For internal network access:

```bash
gcloud run deploy buildkite-pipeline-builder \
  --image gcr.io/YOUR_PROJECT_ID/buildkite-pipeline-builder \
  --vpc-connector your-vpc-connector \
  --vpc-egress private-ranges-only
```

## Monitoring and Logs

### View Logs

```bash
# Real-time logs
gcloud logs tail --service=buildkite-pipeline-builder

# Historical logs
gcloud logs read --service=buildkite-pipeline-builder --limit=100
```

### Monitoring

- **Cloud Console**: Navigate to Cloud Run > buildkite-pipeline-builder
- **Metrics**: CPU, Memory, Request count, Response time
- **Alerts**: Set up alerts for errors or high resource usage

## Troubleshooting

### Common Issues

1. **Authentication Error**:
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```

2. **API Not Enabled**:
   ```bash
   gcloud services enable run.googleapis.com
   gcloud services enable cloudbuild.googleapis.com
   ```

3. **Insufficient Permissions**:
   Ensure your account has these roles:
   - Cloud Run Admin
   - Cloud Build Editor
   - Storage Admin

4. **Docker Build Fails**:
   ```bash
   # Test locally first
   docker build -t test-image .
   docker run -p 8080:8080 test-image
   ```

### Health Check

The application includes a health check endpoint:
```
GET /health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0"
}
```

## Cost Optimization

### Scaling Configuration

```bash
gcloud run deploy buildkite-pipeline-builder \
  --min-instances 0 \
  --max-instances 5 \
  --concurrency 100
```

### Resource Limits

- **Minimum**: 256Mi memory, 0.25 CPU
- **Recommended**: 512Mi memory, 1 CPU
- **Maximum**: 4Gi memory, 2 CPU

### Pricing Estimate

With default settings (512Mi memory, 1 CPU):
- **Free tier**: 2 million requests/month
- **Cost**: ~$0.40 per million requests
- **Idle time**: No charge when not serving requests

## Updates and Rollbacks

### Update the Service

```bash
# Rebuild and deploy
./deploy.sh

# Or deploy specific image
gcloud run deploy buildkite-pipeline-builder \
  --image gcr.io/YOUR_PROJECT_ID/buildkite-pipeline-builder:latest
```

### Rollback to Previous Version

```bash
# List revisions
gcloud run revisions list --service=buildkite-pipeline-builder

# Rollback to specific revision
gcloud run services update-traffic buildkite-pipeline-builder \
  --to-revisions=REVISION_NAME=100
```

## Support

### Useful Commands

```bash
# Service status
gcloud run services describe buildkite-pipeline-builder --region=us-central1

# Service URL
gcloud run services describe buildkite-pipeline-builder --region=us-central1 --format='value(status.url)'

# Delete service
gcloud run services delete buildkite-pipeline-builder --region=us-central1
```

### Additional Resources

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud Build Documentation](https://cloud.google.com/build/docs)
- [Container Registry Documentation](https://cloud.google.com/container-registry/docs)

---

**Happy deploying!** 🚀 Your Buildkite Pipeline Builder will be live on Google Cloud Run!
