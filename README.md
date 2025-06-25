<<<<<<< HEAD
# 🍃 Minty - Smart Budgeting App

A modern, intelligent budgeting application that predicts expenses based on your Google Calendar events and helps you stay on top of your finances.

## ✨ Features

### 🎯 Smart Expense Prediction
- **AI-powered categorization** of calendar events
- **Spending probability scores** for each event
- **Expected spending ranges** based on event type and timing
- **Predictive analytics** for future expenses

### 📊 Advanced Dashboard
- **Real-time financial overview** (Income, Expenses, Balance, Predicted Spending)
- **High spending alerts** for events with >70% spending probability
- **Category-wise spending breakdown**
- **Transaction linking** to calendar events

### 🔄 Calendar Integration
- **Google Calendar sync** with automatic event categorization
- **8 detailed categories**: Dining & Social, Travel & Transportation, Shopping & Retail, Entertainment & Recreation, Health & Medical, Education & Training, Work & Business, Personal & Social
- **Smart keyword analysis** using event title, description, and location

### 💰 Transaction Management
- **Manual transaction entry** with event linking
- **Category-based organization**
- **Income vs Expense tracking**
- **Historical spending analysis**

### 🎨 Modern UI/UX
- **Glass morphism design** with dark theme
- **Responsive layout** for all devices
- **Smooth animations** with Framer Motion
- **Intuitive navigation** and user experience

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Google Cloud Console account
- Google Calendar API access

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/minty.git
   cd minty
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your Google OAuth credentials:
   ```env
   DATABASE_URL="file:./dev.db"
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   GOOGLE_REDIRECT_URI="http://localhost:3000/google-callback"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-nextauth-secret"
   ```

4. **Set up database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Calendar API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/google-callback` (development)
   - `https://your-domain.com/google-callback` (production)

## 📱 Features Comparison

| Feature | Minty | Mint | YNAB | Personal Capital |
|---------|-------|------|------|------------------|
| Calendar Integration | ✅ | ✅ | ❌ | ❌ |
| Expense Prediction | ✅ | ❌ | ✅ | ❌ |
| Smart Categorization | ✅ | ✅ | ✅ | ✅ |
| Transaction Linking | ✅ | ✅ | ❌ | ❌ |
| Real-time Analytics | ✅ | ✅ | ✅ | ✅ |
| Mobile Responsive | ✅ | ✅ | ✅ | ✅ |

## 🏗 Architecture

```
src/
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components
│   └── AddTransactionModal.tsx
├── features/             # Feature-based organization
│   ├── auth/            # Authentication
│   └── budget/          # Budgeting features
├── hooks/               # Custom React hooks
├── services/            # API service layer
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
└── constants/           # App constants
```

## 🚀 Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables
4. Deploy

### Docker
```bash
docker build -t minty .
docker run -p 3000:3000 minty
```

### Railway
1. Connect GitHub repository
2. Add environment variables
3. Deploy

## 📊 Database Schema

- **Users**: User authentication and profile data
- **CalendarEvents**: Google Calendar events with spending analysis
- **Transactions**: Financial transactions linked to events
- **Categories**: Custom spending categories
- **Budgets**: Budget goals and limits

## 🛠 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4, Framer Motion
- **Database**: SQLite (dev), PostgreSQL (prod)
- **ORM**: Prisma
- **Authentication**: Google OAuth
- **Deployment**: Vercel, Docker, Railway

## 🔮 Roadmap

- [ ] Bank account integration (Plaid)
- [ ] Recurring transaction detection
- [ ] Budget goals and alerts
- [ ] Bill payment reminders
- [ ] Investment tracking
- [ ] Export reports (CSV/PDF)
- [ ] Mobile app (React Native)
- [ ] Multi-currency support
- [ ] Family/shared budgets
- [ ] AI-powered spending insights

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google Calendar API for event integration
- Next.js team for the amazing framework
- Prisma team for the excellent ORM
- Tailwind CSS for the utility-first styling

---

**Made with ❤️ for better financial management**
=======
# minti
>>>>>>> f23ea21449abec4a3dbc51ad57ade33a4aaa819b
