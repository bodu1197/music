# Deploy to Google Cloud Run
write-host "Deploying to Google Cloud Run..."

# 1. Build and submit to Container Registry (requires gcloud installed)
# Replace PROJECT_ID with your actual Google Cloud Project ID
# gcloud builds submit --tag gcr.io/PROJECT_ID/vibestation-backend

# 2. Deploy to Cloud Run
# gcloud run deploy vibestation-backend --image gcr.io/PROJECT_ID/vibestation-backend --platform managed --region us-central1 --allow-unauthenticated

write-host "Please run the following commands manually in your terminal (adjust PROJECT_ID):"
write-host "gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/vibestation-backend ."
write-host "gcloud run deploy vibestation-backend --image gcr.io/YOUR_PROJECT_ID/vibestation-backend --platform managed --region us-central1 --allow-unauthenticated"
