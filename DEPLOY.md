# Deploying Eyecore Backend to Vercel

## Pre-requisites
- MongoDB Atlas cluster (you have this ✅)
- Cloudinary account (free at cloudinary.com)
- Razorpay account (dashboard.razorpay.com)
- GitHub account

---

## Step 1 — Get your Cloudinary credentials
1. Go to https://cloudinary.com and sign up (free)
2. On the Dashboard you'll see:
   - Cloud Name
   - API Key
   - API Secret
3. Keep these handy for Step 4

---

## Step 2 — Push backend to GitHub
```bash
cd ecommerce-backend
git init
git add .
git commit -m "initial backend"
git remote add origin https://github.com/YOUR_USERNAME/eyecore-backend.git
git push -u origin main
```

---

## Step 3 — Deploy to Vercel
1. Go to https://vercel.com → New Project
2. Import your eyecore-backend GitHub repo
3. Framework Preset: **Other**
4. Root Directory: leave as-is (/)
5. Click Deploy (it will fail — that's fine, we add env vars next)

---

## Step 4 — Add Environment Variables in Vercel
Go to your project → Settings → Environment Variables
Add ALL of these:

| Variable                  | Value                                                      |
|---------------------------|------------------------------------------------------------|
| MONGO_URI                 | mongodb+srv://user:pass@cluster.mongodb.net/ecommerce...   |
| SESSION_SECRET            | any_long_random_string_min_32_chars                        |
| CLIENT_URL                | https://your-frontend.vercel.app  (your customer frontend) |
| CLOUDINARY_CLOUD_NAME     | your_cloud_name from Cloudinary Dashboard                  |
| CLOUDINARY_API_KEY        | your_api_key from Cloudinary Dashboard                     |
| CLOUDINARY_API_SECRET     | your_api_secret from Cloudinary Dashboard                  |
| RAZORPAY_KEY_ID           | rzp_test_xxxxxxxxxxxx                                      |
| RAZORPAY_KEY_SECRET       | your_razorpay_secret                                       |
| NODE_ENV                  | production                                                 |

After adding all variables → Redeploy

---

## Step 5 — Update MongoDB Atlas Network Access
1. Go to Atlas → Network Access → Add IP Address
2. Click "Allow Access from Anywhere" (0.0.0.0/0)
   (Vercel uses dynamic IPs so we must allow all)
3. Click Confirm

---

## Step 6 — Update your frontend env variables
Your customer frontend (already on Vercel) needs to point to the new backend.

In your FRONTEND Vercel project → Settings → Environment Variables:
```
REACT_APP_API_URL=https://your-backend.vercel.app
```

Then update all axios calls in your frontend from:
  https://e-commerce-backend-node-js-eyecore.vercel.app
to:
  https://YOUR-NEW-BACKEND.vercel.app

OR — create a .env in your frontend:
```
REACT_APP_API_URL=https://your-new-backend.vercel.app
```
And replace all hardcoded URLs with:  process.env.REACT_APP_API_URL

---

## Step 7 — Test your deployment
Visit these URLs in your browser:

  https://your-backend.vercel.app/health
  → should return { "status": "ok" }

  https://your-backend.vercel.app/products
  → should return [] (empty array initially)

---

## How images work after Cloudinary setup

BEFORE (local):  product.image = "uploads/filename.jpg"
AFTER (Cloudinary): product.image = "https://res.cloudinary.com/your_cloud/image/upload/..."

Your frontend ProductCard/ProductGrid/Home already use:
  image={`https://eyecore-backend.onrender.com/${item.image}`}

Change this to just:
  image={item.image}

Because item.image is now a FULL Cloudinary URL — no prefix needed!

---

## Common Issues

Problem: CORS error in browser
Fix: Make sure CLIENT_URL in Vercel env vars exactly matches your frontend URL (no trailing slash)

Problem: Session not persisting (always 401)
Fix: Make sure NODE_ENV=production and cookie sameSite=none + secure=true are set

Problem: Images not uploading
Fix: Check CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET are all correct

Problem: MongoDB connection error
Fix: Check Atlas Network Access allows 0.0.0.0/0
