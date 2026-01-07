# Backend - Slug and Pass URL Generator

This Python script connects to Google Sheets, generates slugs from student names, and creates pass URLs.

## Prerequisites

1. **Google Cloud Project Setup**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the Google Sheets API and Google Drive API

2. **Service Account**:
   - Navigate to "IAM & Admin" > "Service Accounts"
   - Click "Create Service Account"
   - Give it a name (e.g., "sheets-slug-generator")
   - Grant it the "Editor" role
   - Click "Done"
   - Click on the created service account
   - Go to "Keys" tab
   - Click "Add Key" > "Create new key"
   - Choose JSON format
   - Download the JSON file and save it as `credentials.json` in the backend directory

3. **Share Google Sheet**:
   - Open your Google Sheet
   - Click "Share" button
   - Add the service account email (found in the credentials.json file, field: `client_email`)
   - Give it "Editor" access
   - Click "Send"

## Installation

```bash
pip install -r requirements.txt
```

Or using a virtual environment (recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Usage

### Basic Usage

```bash
python generate_slugs.py --sheet "Your Sheet Name" --base-url "https://yourfrontend.com"
```

### Options

- `--credentials`: Path to credentials JSON file (default: `credentials.json`)
- `--sheet`: Name of the Google Sheet (required)
- `--base-url`: Base URL for pass pages, e.g., `https://yourfrontend.com` (required)
- `--dry-run`: Run without making changes to the sheet (for testing)
- `--export-json`: Export student data to JSON file for frontend use

### Examples

**Dry run (test without making changes):**
```bash
python generate_slugs.py --sheet "Workshop Students" --base-url "https://yourfrontend.com" --dry-run
```

**Generate slugs and URLs, then export to JSON:**
```bash
python generate_slugs.py --sheet "Workshop Students" --base-url "https://yourfrontend.com" --export-json students.json
```

## Google Sheet Format

Your Google Sheet should have these columns:

| Name | AI BOOTCAMP | Slug | Pass URL |
|------|-------------|------|----------|
| Rahul Sharma | Introduction to Machine Learning | (auto-generated) | (auto-generated) |
| Priya Patel | Deep Learning Fundamentals | (auto-generated) | (auto-generated) |

The script will:
- Generate slugs from names (e.g., "Rahul Sharma" → "rahul-sharma")
- Create pass URLs: `https://yourfrontend.com/pass/rahul-sharma`
- Update both Slug and Pass URL columns

## How It Works

1. Authenticates with Google Sheets API
2. Opens the specified Google Sheet
3. For each student:
   - Generates a slug: lowercase name with hyphens
   - Creates pass URL: `{base-url}/pass/{slug}`
   - Updates Slug and Pass URL columns
4. Optionally exports data to JSON for frontend use

## Troubleshooting

**Error: "Sheet not found"**
- Verify the sheet name matches exactly (case-sensitive)
- Ensure the service account has access to the sheet

**Error: "Authentication failed"**
- Check that the credentials.json file is valid
- Verify the service account has necessary permissions

**Error: "Column not found"**
- Ensure your sheet has columns: "Name", "AI BOOTCAMP", "Slug", "Pass URL"
- Column names are case-sensitive

