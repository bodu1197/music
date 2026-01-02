# Deploy to Google Cloud Run
write-host "Deploying to Google Cloud Run..."

# 1. Build and submit to Container Registry (requires gcloud installed)
# Replace PROJECT_ID with your actual Google Cloud Project ID
# gcloud builds submit --tag gcr.io/PROJECT_ID/vibestation-backend

# 2. Deploy to Cloud Run
# gcloud run deploy vibestation-backend --image gcr.io/PROJECT_ID/vibestation-backend --platform managed --region us-central1 --allow-unauthenticated

write-host "Please run the following commands manually in your terminal (adjust PROJECT_ID):"
write-host ""
write-host "# Step 1: Build and push container image"
write-host "gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/vibestation-backend ."
write-host ""
write-host "# Step 2: Deploy with min-instances=1 to prevent cold starts"
write-host "gcloud run deploy vibestation-backend --image gcr.io/YOUR_PROJECT_ID/vibestation-backend --platform managed --region us-central1 --allow-unauthenticated --min-instances=1"
write-host ""
write-host "# Or update existing service to prevent cold starts:"
write-host "gcloud run services update vibestation-backend --min-instances=1 --region=us-central1"
