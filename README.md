# Potluck Planner (Diwali 2026)

A simple potluck planning site with sections (Appetizers, Entree, Dessert, Beverages). No auth. Data is stored in **Google Cloud Firestore**.

## Local development

Requirements: Node 18+

```bash
npm install

# Authenticate so firebase-admin can reach Firestore
gcloud auth application-default login
export GOOGLE_CLOUD_PROJECT=YOUR_GCP_PROJECT_ID

npm run dev
# open http://localhost:8080
```

Optional: use the Firestore emulator instead of a real project:

```bash
export FIRESTORE_EMULATOR_HOST=localhost:8081
export GOOGLE_CLOUD_PROJECT=demo-potluck
npm run dev
```

## GCP one-time setup

1. Create or select a GCP project and enable APIs:

```bash
gcloud config set project YOUR_GCP_PROJECT_ID
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  firestore.googleapis.com \
  iam.googleapis.com
```

2. Create a Firestore database in **Native mode** (Console → Firestore → Create database).

3. Grant the Cloud Run runtime service account Firestore access (default Compute SA works):

```bash
PROJECT_ID=$(gcloud config get-value project)
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
RUNTIME_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${RUNTIME_SA}" \
  --role="roles/datastore.user"
```

4. Grant Cloud Build permission to deploy Cloud Run and write images:

```bash
PROJECT_ID=$(gcloud config get-value project)
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
CB_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${CB_SA}" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${CB_SA}" \
  --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${CB_SA}" \
  --role="roles/artifactregistry.admin"
```

## GitHub → Cloud Build auto-deploy

1. Push this repo to GitHub.
2. In GCP Console → **Cloud Build → Triggers → Connect repository**, install the GitHub App and select this repo.
3. Create a trigger:
   - Event: Push to a branch
   - Branch: `^main$` (or `^master$`)
   - Configuration: Cloud Build configuration file
   - Location: `/cloudbuild.yaml`
4. Push to `main` — Cloud Build will build the Docker image, push it to Artifact Registry, and deploy to Cloud Run (`potluck-site` in `us-west1` by default).

You can override `_REGION`, `_SERVICE`, or `_REPO` as trigger substitution variables.

Manual build (optional):

```bash
gcloud builds submit --config cloudbuild.yaml
```

## API

- `GET /api/items`
- `POST /api/items` `{ name, dish, section }`
- `PUT /api/items/:id`
- `DELETE /api/items/:id`

`section` must be one of: `appetizers`, `entree`, `dessert`, `beverages`.
