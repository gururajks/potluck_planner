Potluck Planner
===============

A minimal potluck planning site with sections (Appetizers, Entree, Dessert, Beverages). No auth.

Local development
-----------------

Requirements: Node 18+

```bash
npm install
npm run dev
# open http://localhost:8080
```

By default, the API uses an in-memory store. Optionally point to Firestore emulator:

```bash
export FIRESTORE_EMULATOR_HOST=localhost:8081
npm run dev
```

Cloud Run deployment
--------------------

```bash
gcloud auth configure-docker
PROJECT=YOUR_PROJECT
REGION=us-central1
IMAGE=gcr.io/$PROJECT/potluck-site

docker build -t $IMAGE .
docker push $IMAGE

gcloud run deploy potluck-site \
  --image $IMAGE \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production
```

Ensure Firestore (Native mode) is enabled. The Cloud Run service account needs Datastore User.

API
---

- GET `/api/items`
- POST `/api/items` `{ name, dish, section }`
- PUT `/api/items/:id`
- DELETE `/api/items/:id`


