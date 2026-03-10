# Eyecore — Complete Backend
### Node.js + Express + MongoDB Atlas + Razorpay

---

## Project Structure

```
ecommerce-backend/
├── server.js                    ← Entry point (all routes registered here)
├── .env                         ← Fill in your secrets (never commit this!)
├── .gitignore
├── package.json
│
├── middleware/
│   ├── auth.js                  ← requireAuth session guard
│   └── upload.js                ← Multer image upload (5MB, images only)
│
├── models/
│   ├── User.js                  ← name, email, phone, password (bcrypt)
│   ├── Product.js               ← productId, name, price, brand, category, gender, shape, image
│   ├── Order.js                 ← customer, shippingAddress, items[], status, Razorpay fields
│   └── Review.js                ← productId, user, rating, text
│
├── routes/
│   ├── auth.js                  ← /register  /login  /logout  /me
│   ├── users.js                 ← /info  /info/:id  (admin dashboard)
│   ├── products.js              ← /products  /products/:id  (CRUD + image upload)
│   ├── orders.js                ← /api/orders  + all sub-routes
│   ├── reviews.js               ← /reviews/:productId  POST /reviews
│   └── payment.js               ← /api/payment/create-order  /api/payment/verify-payment
│
└── uploads/                     ← Product images (auto-created, gitignored)
```

---

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Fill in .env
```
MONGO_URI=mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/ecommerce?retryWrites=true&w=majority
SESSION_SECRET=any_long_random_string_here
PORT=5000
CLIENT_URL=http://localhost:3000
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

### 3. Run
```bash
npm run dev    # development (nodemon)
npm start      # production
```

---

## Complete API Reference

AUTH
POST   /register        body: name, email, phone, password
POST   /login           body: email, password
POST   /logout
GET    /me              returns logged-in user (session required)

USERS (Admin Dashboard)
GET    /info            all users
PUT    /info/:id        update user
DELETE /info/:id        delete user

PRODUCTS
GET    /products        all products
GET    /products/:id    single product
POST   /products        add product (multipart/form-data with image)
PUT    /products/:id    update product
DELETE /products/:id    delete product + image file

ORDERS
GET    /api/orders                    all orders (admin)
GET    /api/orders/my-orders          logged-in customer orders
GET    /api/orders/:id                single order
POST   /api/orders                    place new order (session required)
PUT    /api/orders/:id                update status/payment (admin)
PUT    /api/orders/:id/cancel         cancel order
PUT    /api/orders/:id/update-status  set Exchange Requested etc
DELETE /api/orders/:id                delete order (admin)

REVIEWS
GET    /reviews/:productId            all reviews for a product
POST   /reviews                       submit a review

PAYMENT (Razorpay)
POST   /api/payment/create-order      create Razorpay order
POST   /api/payment/verify-payment    verify payment signature

---

## Checkout Flow

1. Customer fills form in checkout.jsx
2a. COD  -> POST /api/orders (paymentMethod: "cod")
2b. Card -> POST /api/payment/create-order
         -> Razorpay popup opens
         -> POST /api/payment/verify-payment (signature verification)
         -> POST /api/orders (paymentMethod: "razorpay", isPaid: true)
3. clearCart() + navigate("/")

---

## Frontend → Backend Map

Auth.jsx               POST /login  POST /register
Profile.jsx            GET /me  GET /api/orders/my-orders
OrderDetails.jsx (FE)  GET /api/orders/:id  PUT /api/orders/:id/cancel
checkout.jsx           POST /api/orders  POST /api/payment/*
ProductDetails.jsx     GET /products/:id  GET /reviews/:id  POST /reviews
ProductGrid/Home       GET /products
Header.jsx             GET /products (search)
Admin Info.jsx         GET /info  PUT /info/:id  DELETE /info/:id
Admin OrderList.jsx    GET /api/orders  PUT /api/orders/:id/cancel
Admin Products.jsx     POST /products
Admin Allproducts.jsx  GET /products  DELETE /products/:id
Admin EditProduct.jsx  GET /products  PUT /products/:id

---

## Deploying to Vercel/Render

1. Push to GitHub
2. Add all .env variables in hosting dashboard
3. Set NODE_ENV=production
4. Set CLIENT_URL to your deployed frontend URL
5. Cookies auto-switch to secure:true + sameSite:"none" in production
