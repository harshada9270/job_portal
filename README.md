# Minimal MERN Job Portal

Run backend:

1. cd "server"
2. npm install
3. copy `.env.example` to `.env` and adjust `MONGO_URI` / `JWT_SECRET` if needed
4. npm run seed
5. npm run dev

Run frontend:

1. cd "client"
2. npm install
3. npm run dev

Defaults:
- Admin: admin@test.com / 123456
- User: user@test.com / 123456

Notes:
- Backend runs on port 5000 by default.
- Frontend expects backend at `http://localhost:5000`.
