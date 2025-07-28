# JobFlow - CV Auto-Application SaaS Platform

JobFlow is a comprehensive SaaS platform that automates job applications by allowing users to upload their CV once and automatically apply to multiple job opportunities across various platforms using email automation.

## 🚀 Features

### Core Functionality
- **CV Upload & Parsing**: Support for PDF, DOC, and DOCX formats with intelligent data extraction
- **Job Search Integration**: Multi-platform job search via Adzuna and Jooble APIs
- **Automated Applications**: SMTP-based email applications with CV attachments
- **Application Tracking**: Complete history and status monitoring of all applications
- **User Dashboard**: Intuitive interface for managing CVs, preferences, and applications

### Pricing Tiers
- **Free**: 5 applications per week
- **Starter**: R50/week for 50 applications
- **Professional**: R100/week for 100 applications  
- **Enterprise**: R350/month for 500+ applications

## 🛠 Technology Stack

### Frontend
- **React** with TypeScript
- **Tailwind CSS** for styling
- **shadcn/ui** component library
- **Wouter** for client-side routing
- **TanStack Query** for server state management
- **React Hook Form** with Zod validation
- **Vite** for development and build tooling

### Backend
- **Node.js** with Express.js
- **TypeScript** for type safety
- **PostgreSQL** database with Neon serverless
- **Drizzle ORM** for database operations
- **Multer** for file upload handling
- **Nodemailer** for email automation

### External Integrations
- **Job Search APIs**: Adzuna, Jooble
- **CV Parsing**: Ready for Affinda/Rchilli integration
- **Email Service**: SMTP configuration support

## 📁 Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utility functions
│   └── index.html
├── server/                 # Backend Express application
│   ├── services/           # Business logic services
│   ├── db.ts              # Database configuration
│   ├── routes.ts          # API endpoints
│   ├── storage.ts         # Data access layer
│   └── index.ts           # Server entry point
├── shared/                 # Shared types and schemas
│   └── schema.ts          # Database schema with Drizzle
├── uploads/               # CV file storage directory
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- SMTP email configuration

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/tsiemasilo/cvautomation.git
   cd cvautomation
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file with:
   ```env
   DATABASE_URL=your_postgresql_connection_string
   SMTP_HOST=your_smtp_host
   SMTP_PORT=587
   SMTP_USER=your_email@domain.com
   SMTP_PASS=your_email_password
   ADZUNA_API_ID=your_adzuna_api_id
   ADZUNA_API_KEY=your_adzuna_api_key
   JOOBLE_API_KEY=your_jooble_api_key
   ```

4. **Set up the database**
   ```bash
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5000`

## 📊 Database Schema

### Users Table
- User authentication and profile information
- Plan-based access control

### CVs Table  
- CV file storage and parsed data
- Support for multiple CV versions per user

### Job Preferences Table
- User-defined job search criteria
- Keywords, locations, industries, salary ranges

### Applications Table
- Complete application history
- Status tracking and response monitoring

## 🔧 API Endpoints

### User Management
- `GET /api/users/:userId` - Get user profile
- `POST /api/users` - Create new user

### CV Management
- `GET /api/users/:userId/cvs` - List user CVs
- `POST /api/cvs/upload` - Upload new CV
- `DELETE /api/cvs/:cvId` - Delete CV

### Job Preferences
- `GET /api/users/:userId/job-preferences` - Get preferences
- `POST /api/users/:userId/job-preferences` - Create/update preferences

### Applications
- `GET /api/users/:userId/applications` - List applications
- `POST /api/applications` - Manual job application
- `POST /api/jobs/auto-apply` - Automated application batch

### Job Search
- `POST /api/jobs/search` - Search jobs across platforms

## 🎯 Key Features

### Automated Job Applications
- Searches multiple job platforms simultaneously
- Applies intelligent filtering based on user preferences
- Sends professional email applications with CV attachments
- Tracks application status and responses

### Smart CV Parsing
- Extracts structured data from uploaded CVs
- Maintains original formatting for applications
- Supports multiple file formats

### User Dashboard
- Real-time application statistics
- Visual analytics and response rates
- Easy preference management
- Application history with detailed logs

## 🔒 Security Features

- Input validation with Zod schemas
- File upload restrictions and validation
- SQL injection prevention with parameterized queries
- Environment variable protection for sensitive data

## 📈 Deployment

The application is designed for easy deployment on platforms like:
- **Replit Deployments** (recommended)
- **Vercel** (frontend) + **Railway** (backend)
- **Netlify** (frontend) + **Heroku** (backend)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@jobflow.app or join our community Discord.

---

**JobFlow** - Streamlining your job search with intelligent automation 🚀