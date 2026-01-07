# Student Workshop Pass Generator

A full-stack solution for generating and sharing professional workshop passes for students. The system connects to Google Sheets for data management and provides a beautiful, shareable pass interface built with React.

## Features

- 📊 **Google Sheets Integration**: Automatically sync student data from Google Sheets
- 🎫 **Professional Pass Design**: Movie ticket-style passes with beautiful styling
- 🔗 **Slug-based URLs**: Clean, shareable URLs using student slugs (e.g., `/pass/rahul-sharma`)
- 📥 **PDF Download**: Download passes as PDF files
- 🔄 **Share Functionality**: Share pass URLs easily
- 🚀 **Easy Deployment**: Ready to deploy on Netlify, Vercel, or Cloudflare Pages
- ⚡ **Fast & Responsive**: Built with React and optimized for performance

## Project Structure

```
passGenerator/
├── frontend/          # React frontend application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   └── ...
│   └── public/
│       └── students.json  # Student data (can be generated from backend)
├── backend/           # Python backend scripts
│   ├── generate_slugs.py  # Main script for Google Sheets sync
│   ├── requirements.txt
│   └── README.md
└── README.md          # This file
```

## Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn
- Python 3.8+
- Google Cloud account (for Sheets API access)
- A Google Sheet with student data

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Set up Google Sheets API credentials (see [Backend README](./backend/README.md) for detailed instructions)

4. Run the script to generate slugs and pass URLs:
```bash
python generate_slugs.py --sheet "Your Sheet Name" --base-url "https://yourfrontend.com"
```

## Google Sheet Format

Your Google Sheet should have these columns:

| Name | AI BOOTCAMP | Slug | Pass URL |
|------|-------------|------|----------|
| Rahul Sharma | Introduction to Machine Learning | (auto-generated) | (auto-generated) |
| Priya Patel | Deep Learning Fundamentals | (auto-generated) | (auto-generated) |

The script will automatically:
- Generate slugs from names (e.g., "Rahul Sharma" → "rahul-sharma")
- Create pass URLs: `https://yourfrontend.com/pass/rahul-sharma`
- Update both Slug and Pass URL columns

## How It Works

### Slug Generation

The Python script converts student names to URL-friendly slugs:
- "Rahul Sharma" → "rahul-sharma"
- "Priya Patel" → "priya-patel"
- Special characters are removed, spaces become hyphens

### Name Conversion

The React app converts slugs back to proper names:
- "rahul-sharma" → "Rahul Sharma"
- "priya-patel" → "Priya Patel"
- First letter of each word is capitalized

### Pass Display

When a user visits `/pass/rahul-sharma`:
1. The app extracts the slug from the URL
2. Fetches student data (from API or static JSON)
3. Converts the slug to a proper name
4. Displays the pass with all student information

## Frontend Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Components

- **PassCard**: Main component that renders the workshop pass
- **PassPage**: Page component that handles routing and data fetching
- **HomePage**: Landing page with instructions

### Routes

- `/` - Home page
- `/pass/:studentSlug` - Individual student pass page

### Data Fetching

The frontend supports two methods for fetching student data:

1. **API Endpoint** (recommended for production):
   - Create an API endpoint at `/api/students/:studentSlug`
   - Return JSON with student data

2. **Static JSON File** (fallback):
   - Place `students.json` in the `public/` directory
   - The backend script can generate this file using `--export-json`

## Deployment

### Frontend Deployment

#### Option 1: Netlify

1. Build the project:
```bash
cd frontend
npm run build
```

2. Deploy to Netlify:
   - Drag and drop the `dist` folder to Netlify
   - Or connect your Git repository for automatic deployments

3. The `netlify.toml` file is already configured for React Router

#### Option 2: Vercel

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
cd frontend
vercel
```

3. Vercel automatically handles React Router redirects (see `vercel.json`)

#### Option 3: Cloudflare Pages

1. Connect your Git repository to Cloudflare Pages
2. Set build command: `npm run build`
3. Set build output directory: `dist`
4. Add redirect rule in Cloudflare Dashboard:
   - Path: `/*`
   - Target: `/index.html`
   - Status: 200

### Backend Automation

The backend script can be run:

1. **Manually**: Run the script whenever you need to update slugs and URLs
2. **Scheduled**: Set up a cron job or scheduled task (see [Backend README](./backend/README.md))
3. **Cloud Function**: Deploy as a Google Cloud Function for automatic execution

## Customization

### Styling

The pass design can be customized in:
- `frontend/src/components/PassCard.css` - Main pass styling
- `frontend/src/pages/PassPage.css` - Page layout
- `frontend/src/pages/HomePage.css` - Home page styling

### Pass Design

To customize the pass appearance:
1. Edit `PassCard.css` to change colors, fonts, and layout
2. Replace the background pattern in the `.pass-right` section
3. Add your own background image by modifying the CSS

## Troubleshooting

### Frontend Issues

**Routes not working after deployment:**
- Ensure redirect rules are configured (see Deployment section)
- Check that the build output includes `index.html`

**Student data not loading:**
- Verify `students.json` is in the `public/` directory
- Check browser console for errors
- Ensure the JSON format matches the expected structure

### Backend Issues

**Google Sheets authentication fails:**
- Verify credentials.json is in the backend directory
- Check that the service account email has access to the sheet
- Ensure Google Sheets API and Drive API are enabled

**Sheet not found:**
- Verify the sheet name matches exactly (case-sensitive)
- Check that the service account has been shared with the sheet

**Slug generation issues:**
- Ensure the Name column contains valid student names
- Check for special characters that might cause issues

## Security Considerations

- Never commit `credentials.json` to version control
- Use environment variables for sensitive data in production
- Implement rate limiting for API endpoints
- Consider adding authentication for admin functions

## License

This project is open source and available for use.

## Support

For issues or questions:
1. Check the [Backend README](./backend/README.md) for backend-specific issues
2. Review the troubleshooting section above
3. Check browser console and network tabs for frontend issues

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

