# FrejFund AI - Investment Intelligence Platform

An AI-powered business analysis and investment readiness platform designed specifically for startups and entrepreneurs. Built with Next.js, TypeScript, Tailwind CSS, and Framer Motion.

## 🚀 Features

### AI-Powered Business Analysis

- **Comprehensive Analysis**: Deep dive into 10 key investment criteria including problem-solution fit, market timing, competitive moat, business model, team execution, traction, and financial health
- **Personalized Insights**: Stage-specific and industry-tailored recommendations based on your business context
- **Real-time Progress**: Step-by-step analysis with visual progress indicators and timing

### Chat-Like AI Interface

- **Conversational Design**: Natural language interaction with FrejFund Business Advisor
- **Agent-Friendly**: Designed for future AI agent compatibility
- **Real-time Responses**: Intelligent responses based on business context and analysis results

### Investment Readiness Assessment

- **Scoring System**: Detailed scoring across 7 key dimensions with overall investment readiness score
- **Risk Assessment**: Identification of key risks with specific mitigation strategies
- **Actionable Recommendations**: Concrete next steps with timelines and expected impact

### Document Analysis

- **Pitch Deck Upload**: Upload and analyze pitch decks, business plans, and financial documents
- **Website Analysis**: Automatic analysis of company website content
- **LinkedIn Integration**: Team analysis based on founder LinkedIn profiles

## 🛠 Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Deployment**: Vercel-ready

## 🏁 Getting Started

### Prerequisites

- Node.js 22 (see .nvmrc)
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone [repository-url]
   cd frejfund-2.0
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:

   ```bash
   cp .env.example .env.local
   ```

   Minimal example:

   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   OPENAI_CHAT_MODEL=gpt-4o-mini   # or gpt-5 if available
   OPENAI_EMBEDDINGS_MODEL=text-embedding-3-small
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NODE_ENV=development
   ```

   Optional overrides:

   ```env
   # Pricing (USD per 1M tokens) for cost estimates in UI
   MODEL_PRICE_INPUT_PER_MTOK=3
   MODEL_PRICE_OUTPUT_PER_MTOK=15

   # If using a proxy / OpenAI project
   OPENAI_BASE_URL=https://api.openai.com/v1
   OPENAI_ORG=
   OPENAI_PROJECT=

   # Azure OpenAI (if applicable)
   AZURE_OPENAI_API_KEY=
   AZURE_OPENAI_ENDPOINT=
   AZURE_OPENAI_DEPLOYMENT=
   AZURE_OPENAI_API_VERSION=2024-05-01-preview
   ```

4. **Start development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 📖 How to Use

### 1. Business Information Wizard

- Enter your basic information (name, email, website)
- Select your business stage (idea, MVP, early-revenue, scaling)
- Choose your industry and target market
- Specify your business model and current metrics
- Upload business documents (optional)

### 2. AI Chat Interface

- Start chatting with FrejFund Business Advisor
- Ask questions about funding strategy, market analysis, team building
- Request comprehensive business analysis
- Get personalized recommendations

### 3. Comprehensive Analysis

- Initiate full business analysis through chat
- Watch real-time progress as AI analyzes your business
- View detailed results across multiple dimensions
- Export and share analysis results

### 4. Results Dashboard

- **Overview**: Company context and key metrics
- **Insights**: Actionable recommendations with specific steps
- **Scores**: Detailed scoring across investment criteria
- **Risks**: Risk assessment with mitigation strategies

## 🎯 Key Analysis Areas

### Investment Criteria

1. **Problem-Solution Fit**: Market validation and solution clarity
2. **Market & Timing**: TAM/SAM analysis and timing catalysts
3. **Competitive Moat**: Differentiation and defensibility
4. **Business Model**: Unit economics and revenue streams
5. **Team Execution**: Founder-market fit and execution capability
6. **Traction**: Growth metrics and customer validation
7. **Financial Health**: Burn rate, runway, and funding needs

### Stage-Specific Insights

- **Idea Stage**: Customer discovery and validation frameworks
- **MVP Stage**: Product-market fit metrics and feedback loops
- **Early Revenue**: Unit economics optimization and growth strategies
- **Scaling**: Organizational design and market expansion

### Industry-Specific Recommendations

- **SaaS**: CAC, LTV, churn, expansion revenue strategies
- **E-commerce**: Conversion optimization, inventory management
- **Marketplace**: Supply/demand balance, network effects
- **Fintech**: Regulatory compliance, trust building
- **HealthTech**: Clinical validation, regulatory pathways

## 🎨 Design Philosophy

### AI-Agent Friendly Design

- Clean, conversational interface optimized for AI interactions
- Minimal cognitive load with clear information hierarchy
- Responsive design that works across all devices
- Accessible color scheme and typography

### User Experience

- **Progressive Disclosure**: Information revealed as needed
- **Visual Feedback**: Smooth animations and transitions
- **Error Handling**: Graceful fallbacks and retry mechanisms
- **Performance**: Optimized for fast loading and interaction

## 🔧 Development

### Project Structure

```
src/
├── app/                 # Next.js app router pages
├── components/          # React components
│   ├── BusinessWizard.tsx
│   ├── ChatInterface.tsx
│   ├── BusinessAnalysisModal.tsx
│   └── ResultsModal.tsx
├── lib/                 # Business logic and utilities
│   └── business-analyzer.ts
└── types/               # TypeScript type definitions
    └── business.ts
```

### Key Components

- **BusinessWizard**: Multi-step form for collecting business information
- **ChatInterface**: Main chat interface with AI agent
- **BusinessAnalysisModal**: Real-time analysis with progress tracking
- **ResultsModal**: Comprehensive results display with tabs and exports

### Business Analysis Engine

The `BusinessAnalyzer` class provides:

- Comprehensive business evaluation across 10+ criteria
- Stage and industry-specific insight generation
- Risk assessment with mitigation strategies
- Personalized recommendations with concrete action steps

## 🚀 Deployment

### Vercel / Railway

1. Push code to GitHub
2. Connect repository to Vercel
3. Deploy with zero configuration

### Worker (BullMQ)

Run the background worker in a separate service/process:

```bash
npm run worker
```

Requires `REDIS_URL`.

```bash
npm run build
npm start
```

## 🔮 Future Enhancements

### AI Integration

- Integration with OpenAI GPT-4 for real-time analysis
- Document processing with AI for pitch deck analysis
- Website scraping and content analysis
- LinkedIn API integration for team analysis

### Advanced Features

- **Benchmarking**: Compare against industry standards
- **Scenario Planning**: Model different growth scenarios
- **Investor Matching**: Connect with relevant investors
- **Progress Tracking**: Monitor improvement over time

### Agent Compatibility

- API endpoints for AI agent integration
- Structured data formats for machine consumption
- Webhook support for real-time updates
- Multi-language support

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

For support, email support@frejfund.ai or join our Slack community.

---

Built with ❤️ for the startup ecosystem. Helping entrepreneurs turn great ideas into fundable businesses.
