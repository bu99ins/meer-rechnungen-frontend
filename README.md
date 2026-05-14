# Meer von Rechnungen Frontend

A modern React-based frontend application for managing invoices, customers, and senders. This SPA provides a user-friendly interface to create, view, edit, and delete invoices with PDF generation capabilities.

## Features

- **Invoice Management**: Create, edit, view, and delete invoices with line items
- **Customer Management**: Maintain customer database with full CRUD operations
- **Sender Management**: Configure sender/company information
- **PDF Generation**: Download invoices as PDF documents
- **Responsive Design**: Built with Tailwind CSS for mobile and desktop compatibility
- **Real-time Updates**: Integrated with backend API for live data synchronization

## Tech Stack

- **Frontend Framework**: React 19 with TypeScript
- **Build Tool**: Vite 6
- **State Management**: Zustand
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **Styling**: Tailwind CSS
- **Icons**: Heroicons
- **Linting**: ESLint with TypeScript support

## Prerequisites

- Node.js (LTS version recommended)
- npm or yarn package manager

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd meer-rechnungen-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory:
   ```
   VITE_API_URL=https://localhost:5001
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run lint` - Run ESLint for code quality checks
- `npm run preview` - Preview the production build locally

## Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/          # Page-level components for different views
├── services/       # API service functions
├── store/          # Zustand state management stores
├── types/          # TypeScript type definitions
├── hooks/          # Custom React hooks
├── lib/            # Utility libraries and configurations
├── utils/          # Helper functions
└── assets/         # Static assets
```

## API Integration

This frontend integrates with the `meer-rechnungen` backend API. Ensure the backend is running and accessible at the configured `VITE_API_URL`.

The application uses JWT-based authentication with tokens stored in localStorage.