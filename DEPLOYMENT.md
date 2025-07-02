# Deployment Guide

Complete guide for deploying the Buildkite Pipeline Builder to Google Cloud Run.

## Prerequisites

- [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) installed
- [Docker](https://docs.docker.com/get-docker/) installed
- Google Cloud project with billing enabled
- Basic familiarity with command line tools

## Quick Deployment

The fastest way to deploy is using the included script:

```bash
./deploy.sh
```

This will guide you through the entire deployment process.

## Manual Deployment

### Step 1: Setup Google Cloud

#### 1.1 Authentication
```bash
# Login to Google Cloud
gcloud auth login

# Set your project ID
export PROJECT_ID="your-project-id"
gcloud config set project $PROJECT_ID
```

#### 1.2 Enable APIs
```bash
# Enable required Google Cloud APIs
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

### Step 2: Build and Push Docker Image

```bash
# Build the Docker image
docker build -t gcr.io/$PROJECT_ID/buildkite-pipeline-builder .

# Push to Google Container Registry
docker push gcr.io/$PROJECT_ID/buildkite-pipeline-builder
```

### Step 3: Deploy to Cloud Run

#### Basic Deployment
```bash
gcloud run deploy buildkite-pipeline-builder \
  --image gcr.io/$PROJECT_ID/buildkite-pipeline-builder \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080
```

#### Production Deployment with Optimizations
```bash
gcloud run deploy buildkite-pipeline-builder \
  --image gcr.io/$PROJECT_ID/buildkite-pipeline-builder \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --concurrency 100 \
  --max-instances 10 \
  --port 8080 \
  --set-env-vars "NODE_ENV=production"
```

### Step 4: Verify Deployment

```bash
# Get the service URL
SERVICE_URL=$(gcloud run services describe buildkite-pipeline-builder \
  --platform managed \
  --region us-central1 \
  --format 'value(status.url)')

echo "Application deployed to: $SERVICE_URL"

# Test the deployment
curl $SERVICE_URL/health
```

## Advanced Configuration

### Resource Limits

Adjust resource limits based on your needs:

```bash
gcloud run deploy buildkite-pipeline-builder \
  --memory 1Gi \
  --cpu 2 \
  --concurrency 50 \
  --max-instances 20
```

### Multiple Regions

Deploy to multiple regions for better availability:

```bash
# Deploy to multiple regions
regions=("us-central1" "europe-west1" "asia-northeast1")

for region in "${regions[@]}"; do
  gcloud run deploy buildkite-pipeline-builder \
    --image gcr.io/$PROJECT_ID/buildkite-pipeline-builder \
    --platform managed \
    --region $region \
    --allow-unauthenticated
done
```

### Custom Domain

#### 1. Add Domain Mapping
```bash
gcloud run domain-mappings create \
  --service buildkite-pipeline-builder \
  --domain your-domain.com \
  --region us-central1
```

#### 2. Configure DNS
1. **Get mapping details**:
   ```bash
   gcloud run domain-mappings describe \
     --domain your-domain.com \
     --region us-central1
   ```

2. **Map your domain** in Cloud Run console
3. **Add DNS records** as instructed
4. **SSL certificates** are automatically provisioned

## Continuous Deployment

### Cloud Build Integration

Set up automatic deployments with Cloud Build:

#### 1. Connect Repository
1. Go to [Cloud Build Triggers](https://console.cloud.google.com/cloud-build/triggers)
2. Click "Create Trigger"
3. Connect your GitHub/GitLab repository
4. Configure trigger on `main` branch pushes

#### 2. Use Included Configuration
The project includes `cloudbuild.yaml` which will:
- Build the Docker image
- Push to Container Registry  
- Deploy to Cloud Run automatically

#### 3. Manual Trigger
```bash
# Trigger build manually
gcloud builds submit --config cloudbuild.yaml .
```

## Security Considerations

### Basic Security

The application is deployed with:
- **No authentication required** - Public access
- **Basic security headers** via Helmet.js
- **HTTPS enforcement** by default on Cloud Run

### Restricting Access (Optional)

To require authentication for access:

```bash
gcloud run deploy buildkite-pipeline-builder \
  --image gcr.io/$PROJECT_ID/buildkite-pipeline-builder \
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
  --image gcr.io/$PROJECT_ID/buildkite-pipeline-builder \
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
  "version": "1.0.3",
  "authentication": "disabled"
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
  --image gcr.io/$PROJECT_ID/buildkite-pipeline-builder:latest
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

**Happy deploying!** 🚀 Your Buildkite Pipeline Builder will be live on Google Cloud Run without any authentication requirements!