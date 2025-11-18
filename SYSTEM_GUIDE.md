# 📘 DhanSarthi AI - System Guide

A simple guide to understand how DhanSarthi works under the hood.

---

## 🎯 What is DhanSarthi?

DhanSarthi is your AI-powered personal finance assistant that helps you:
- Track your money (income & expenses)
- Plan your savings goals
- Analyze loans and EMIs
- Get tax-saving tips
- Chat with an AI mentor for financial advice

---

## 🏗️ System Architecture

### Frontend (What You See)
- **Technology**: React + TypeScript + Vite
- **UI Library**: Tailwind CSS + Shadcn components
- **Pages**:
  - Dashboard - Overview of your finances
  - Smart Planner - Budget tracking
  - Loan Analyzer - EMI calculator & tracker
  - Tax Tips - Personalized tax advice
  - Expense Calendar - Daily expense logging
  - AI Mentor - Chat with AI for financial guidance
  - Memory Dashboard - View your financial patterns

### Backend (The Brain)
- **Technology**: Node.js + Express
- **Database**: MongoDB (stores all your data)
- **AI Engine**: Google Gemini AI
- **Key Features**:
  - User authentication (login/signup)
  - Transaction management
  - Loan calculations
  - Goal tracking
  - AI-powered insights
  - Smart notifications

---

## 🔧 Core Modules

### 1. **Authentication System**
- Secure login/signup with JWT tokens
- Password encryption using bcrypt
- Protected routes for user data

### 2. **Transaction Manager**
- Track income and expenses
- Categorize transactions
- Monthly summaries
- Expense analytics

### 3. **Loan Analyzer**
- Calculate EMI amounts
- Track loan payments
- Show remaining balance
- Payment history

### 4. **Goal Planner**
- Set savings goals
- Track progress
- Smart allocation suggestions
- Goal completion notifications

### 5. **Tax Assistant**
- Personalized tax regime recommendations (Old vs New)
- Tax-saving investment suggestions
- Deduction tracking
- Smart tax tips based on your income

### 6. **AI Mentor**
- Chat interface for financial questions
- Context-aware responses
- Personalized advice based on your data
- Memory of past conversations

### 7. **Memory System**
- Learns your spending patterns
- Remembers your financial goals
- Tracks your preferences
- Provides contextual insights

### 8. **Notification Engine**
- Smart alerts for:
  - Upcoming EMI payments
  - Goal milestones
  - Budget warnings
  - Tax-saving opportunities
  - Unusual spending patterns

---

## 📊 How Data Flows

```
User Action → Frontend → API Request → Backend → Database
                                          ↓
                                      AI Engine (if needed)
                                          ↓
                                      Response → Frontend → User Sees Result
```

### Example: Adding an Expense
1. You enter expense details in the app
2. Frontend sends data to backend API
3. Backend validates and saves to MongoDB
4. AI analyzes if it's unusual spending
5. Notification system checks budget limits
6. Response sent back to update your dashboard

---

## 🤖 AI Features

### How AI Works in DhanSarthi:

1. **Contextual Understanding**
   - AI reads your financial profile
   - Understands your goals and income
   - Knows your spending patterns

2. **Smart Recommendations**
   - Tax-saving suggestions based on your income bracket
   - Investment advice aligned with your goals
   - Budget optimization tips

3. **Conversational Mentor**
   - Ask questions in plain language
   - Get personalized answers
   - Learn financial concepts easily

4. **Proactive Insights**
   - Detects unusual spending
   - Suggests better loan options
   - Alerts about tax deadlines

---

## 🔐 Security Features

- **Password Protection**: Encrypted with bcrypt
- **JWT Tokens**: Secure session management
- **CORS Protection**: Prevents unauthorized access
- **Helmet.js**: Security headers
- **Environment Variables**: Sensitive data kept secret

---

## 🚀 Deployment Setup

### Pre-Deployment Checklist ✅

- [x] All test files removed
- [x] Documentation cleaned up
- [x] Environment variables configured
- [x] CORS settings updated
- [x] Production build tested
- [x] Database connection verified
- [x] API endpoints tested

### Environment Variables Needed:

**Frontend (.env)**
```
VITE_API_BASE_URL=your-backend-url
```

**Backend (backend/.env)**
```
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d
PORT=5001
NODE_ENV=production
GEMINI_API_KEY=your-gemini-api-key
```

### Deployment Platforms:
- **Frontend**: Vercel (automatic deployment)
- **Backend**: Render or Railway (Node.js hosting)
- **Database**: MongoDB Atlas (cloud database)

### Quick Deployment Steps:

1. **Setup MongoDB Atlas**
   - Create free cluster at mongodb.com
   - Get connection string
   - Add to backend/.env

2. **Get Gemini API Key**
   - Visit ai.google.dev
   - Create API key (free)
   - Add to backend/.env

3. **Deploy Backend**
   - Push code to GitHub
   - Connect to Render/Railway
   - Add environment variables
   - Deploy

4. **Deploy Frontend**
   - Push code to GitHub
   - Connect to Vercel
   - Add VITE_API_BASE_URL (your backend URL)
   - Deploy

5. **Test Everything**
   - Visit your frontend URL
   - Create account
   - Test all features

---

## 📁 Project Structure

```
dhan-sarthi-ai/
├── src/                    # Frontend code
│   ├── components/         # UI components
│   ├── pages/             # App pages
│   ├── contexts/          # State management
│   ├── hooks/             # Custom React hooks
│   └── services/          # API calls
│
├── backend/               # Backend code
│   ├── models/           # Database schemas
│   ├── routes/           # API endpoints
│   ├── services/         # Business logic
│   ├── middleware/       # Auth & validation
│   └── server.js         # Main server file
│
├── public/               # Static assets
└── package.json          # Dependencies
```

---

## 🔄 Key Workflows

### 1. User Onboarding
- Sign up → Profile setup → Income details → Tax regime selection → Dashboard

### 2. Daily Usage
- Log expenses → View dashboard → Check notifications → Chat with AI

### 3. Goal Setting
- Create goal → Set target amount → Track progress → Get allocation suggestions

### 4. Loan Management
- Add loan details → Track EMIs → View payment schedule → Get payoff insights

### 5. Tax Planning
- View tax tips → Track deductions → Get regime recommendations → Save taxes

---

## 🛠️ Development Commands

```bash
# Install dependencies
npm install

# Run frontend (development)
npm run dev

# Build frontend (production)
npm run build

# Run backend (development)
cd backend
npm run dev

# Run backend (production)
cd backend
npm start
```

---

## 📱 API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Get user profile

### Transactions
- `GET /api/transactions` - List all transactions
- `POST /api/transactions` - Add transaction
- `DELETE /api/transactions/:id` - Delete transaction

### Loans
- `GET /api/loans` - List all loans
- `POST /api/loans` - Add loan
- `POST /api/loans/:id/payment` - Record payment

### Goals
- `GET /api/goals` - List all goals
- `POST /api/goals` - Create goal
- `PUT /api/goals/:id` - Update goal

### AI Mentor
- `POST /api/ai/chat` - Chat with AI
- `GET /api/ai/messages` - Get chat history

### Tax
- `GET /api/tax/tips` - Get tax tips
- `POST /api/tax/regime-recommendation` - Get regime suggestion

### Notifications
- `GET /api/notifications` - Get all notifications
- `PUT /api/notifications/:id/read` - Mark as read

---

## 🎨 UI Components

Built with **Shadcn UI** - a collection of beautiful, accessible components:
- Cards, Buttons, Forms
- Dialogs, Modals, Toasts
- Charts, Progress bars
- Calendars, Date pickers
- And more...

---

## 💡 Tips for Developers

1. **Environment Setup**: Always copy `.env.example` to `.env` and fill in your values
2. **Database**: Use MongoDB Atlas for cloud database (free tier available)
3. **AI Key**: Get Gemini API key from Google AI Studio (free)
4. **Testing**: Test locally before deploying
5. **CORS**: Update allowed origins in `backend/server.js` for your domain

---

## 🐛 Common Issues & Solutions

### Issue: "Cannot connect to database"
**Solution**: Check your MONGODB_URI in backend/.env

### Issue: "AI not responding"
**Solution**: Verify GEMINI_API_KEY is valid and has quota

### Issue: "CORS error"
**Solution**: Add your frontend URL to allowed origins in server.js

### Issue: "401 Unauthorized"
**Solution**: Check if JWT_SECRET matches between requests

---

## 📈 Future Enhancements

- Investment portfolio tracking
- Bill payment reminders
- Credit score monitoring
- Multi-currency support
- Family account sharing
- Export reports (PDF/Excel)
- Mobile app (React Native)

---

## 🤝 Contributing

This is a hackathon project built for learning and innovation. Feel free to:
- Report bugs
- Suggest features
- Improve documentation
- Submit pull requests

---

## 📞 Support

For questions or issues:
- Check this guide first
- Review the README.md
- Check the code comments
- Test with the provided test scripts in `backend/`

---

## 🎓 Learning Resources

To understand the technologies used:
- **React**: [react.dev](https://react.dev)
- **Node.js**: [nodejs.org](https://nodejs.org)
- **MongoDB**: [mongodb.com/docs](https://mongodb.com/docs)
- **Gemini AI**: [ai.google.dev](https://ai.google.dev)
- **Tailwind CSS**: [tailwindcss.com](https://tailwindcss.com)

---

**Built with ❤️ for smarter financial futures**

*Last Updated: November 2024*
