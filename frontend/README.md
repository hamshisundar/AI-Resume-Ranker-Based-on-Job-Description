# Resume Ranking Frontend

A production-ready React frontend for the Resume Ranking application, built with Vite, Tailwind CSS, and Axios.

## Features

- **Upload Mode**: Rank multiple PDF resumes against a job description.
- **Paste Mode**: Paste resume text directly to rank candidates.
- **Real-time Ranking**: Connects to the Flask backend for scoring.
- **Detailed Explanations**: View top contributing factors for each score.
- **Export Results**: Download rankings as CSV.
- **Responsive UI**: Clean, modern interface built with Tailwind CSS.

## Prerequisites

- Node.js (v18 or higher)
- Flask Backend running on `http://127.0.0.1:5000` (or configured URL)

## Setup & Installation

1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Set up Environment Variables (Optional):
    Create a `.env` file in the root of the `frontend` directory if your backend is not running on localhost:5000.
    ```env
    VITE_API_BASE_URL=http://your-backend-api-url:5000
    ```
    Default is `http://127.0.0.1:5000`.

## Running the Application

Start the development server:

```bash
npm run dev
```

Open your browser at `http://localhost:5173`.

## Project Structure

- `src/api`: Axios client and API service functions.
- `src/components`: Reusable UI components (Forms, Tables, etc.).
- `src/lib`: Utility functions (cn for class merging).
- `src/App.jsx`: Main application logic and layout.

## Technologies

- React + Vite
- Tailwind CSS
- Axios
- Lucide React (Icons)
