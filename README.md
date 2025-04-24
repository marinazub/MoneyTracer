# Spending Tracker App

A React-based financial transaction analyzer that helps users track, categorize, and visualize their spending patterns with advanced monthly comparison and recurring transaction insights.

## Features

- **Transaction Management**: Upload, categorize, and analyze financial transactions
- **Multi-file Support**: Upload and analyze transactions from multiple sources simultaneously
- **Category Management**: Create custom categories and mark them as fixed or flexible expenses
- **Spending Analytics**: View total spending by category with clear fixed vs. flexible breakdowns
- **Monthly Comparison**: Analyze month-over-month spending trends and category changes
- **Recurring Transaction Detection**: Identify subscription services and recurring payments
- **Transaction Flagging**: Flag suspicious transactions for further review
- **Interactive Dashboard**: Toggle between transaction list and analytics dashboard views

## Tech Stack

- React.js with TypeScript
- Vite for fast development and building
- Tailwind CSS with shadcn/ui components for styling
- Node.js/Express backend for API services
- Chart visualization with Recharts

## Getting Started

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm run dev
   ```

## Usage

1. **Upload Transaction Data**: 
   - Use the file uploader to import CSV transaction data
   - Optionally use the demo data option to explore the app features

2. **Filter Transactions**:
   - Select date ranges to focus on specific time periods
   - Click on categories to view transactions in that category

3. **Analyze Spending**:
   - Toggle between transaction list and dashboard views
   - Review fixed vs. flexible spending breakdowns
   - Identify spending trends and recurring payments

4. **Manage Categories**:
   - Create custom categories and mark them as fixed or flexible
   - Edit transaction categories as needed
   - Flag suspicious transactions for further review

## CSV Format

The app expects CSV files with the following columns:
- Transaction Date (MM/DD/YYYY format)
- Description
- Amount (negative for expenses, positive for income)
- Category (optional)
- Type (optional)
- Memo (optional)

## License

MIT License