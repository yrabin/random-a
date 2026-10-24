#!/usr/bin/env bash
# Deploy PSLE Otter to Google Cloud Run (Singapore). Requires: gcloud CLI, a project with billing enabled
# (Cloud Run's free tier normally keeps a family-sized app at $0 - check current limits).
set -euo pipefail
PROJECT="${1:?usage: deploy/cloudrun.sh <gcp-project-id> [region] [service-name]}"
REGION="${2:-asia-southeast1}"
SERVICE="${3:-psle-otter}"

gcloud config set project "$PROJECT"
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com

gcloud run deploy "$SERVICE" \
  --source . \
  --region "$REGION" \
  --allow-unauthenticated \
  --port 8080 \
  --memory 128Mi --cpu 1 \
  --min-instances 0 --max-instances 2 \
  --set-env-vars NODE_ENV=production

echo
echo "Your app is live at:"
gcloud run services describe "$SERVICE" --region "$REGION" --format='value(status.url)'
