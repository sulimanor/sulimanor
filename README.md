# SuliManor Collection — Website (v2)

What's new in this version:
- **Cart**: customers can add multiple pieces before checking out, not just one at a time.
- **Delivery details**: checkout asks for the customer's name and delivery location, included automatically in the order message.
- **Order message**: lists every item, quantity, and the total price.
- **Photo upload in admin**: tap "Tap to choose a photo" to pick an image from your phone or computer — no image hosting site needed. The photo is compressed and stored directly in your database, so it won't disappear.
- **Clearer admin login errors**: if sign-in fails, the exact reason now shows (wrong password, no such account, network issue, etc.) instead of a generic message.

## How ordering works for customers
1. They add one or more pieces to their cart.
2. They tap Checkout, enter their name and delivery location.
3. They tap WhatsApp / Instagram / Facebook / Viber — the order details are copied to their clipboard automatically and the chosen app opens.
4. They paste the order into the chat that opens. (Instagram and Facebook don't allow pre-filling a message from outside their app, so the copy-and-paste step is the most reliable way to make sure your order details always arrive intact, instead of relying on a link that might not carry the text through.)

## Setup
Same Firebase project as before — your keys and contact details are already filled in in `js/firebase-config.js` and `js/shop-settings.js`. Just upload these files to your GitHub repository the same way as before, replacing the old ones (keep the same folder structure: `css/style.css`, `css/admin.css`, `js/app.js`, `js/admin.js`, `js/firebase-config.js`, `js/shop-settings.js`, plus `index.html` and `admin.html` in the root).

## A note on photos
Photos are stored as compressed images directly inside your free Firestore database (no separate storage service needed). Each photo is automatically shrunk before saving, so this stays well within the free tier even with many products.

## If admin login still doesn't work
Open the admin page and try signing in — if it fails, it will now show you the *exact* reason (e.g. "Incorrect password" or "No admin account found with that email"). Double check:
- You're using the same email you originally created in Firebase Authentication → Users.
- Email/Password sign-in is still Enabled in Firebase Authentication → Sign-in method.
