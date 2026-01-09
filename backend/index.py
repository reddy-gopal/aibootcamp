

import gspread
from google.oauth2.service_account import Credentials
import os
import re
from typing import List, Dict, Optional
from urllib.parse import urlparse


class SlugGenerator:
    def __init__(self, credentials_path: str, sheet_url: str, worksheet_name: str):
        """
        Initialize the Slug Generator.

        Args:
            credentials_path: Path to Google Service Account JSON credentials file
            sheet_url: URL of the Google Sheet
            worksheet_name: Name of the worksheet/tab within the spreadsheet
        """
        self.credentials_path = credentials_path
        self.sheet_url = sheet_url
        self.worksheet_name = worksheet_name
        self.client = None
        self.sheet = None

    def authenticate(self):
        """Authenticate with Google Sheets API."""
        try:
            scope = [
                'https://www.googleapis.com/auth/spreadsheets',
                'https://www.googleapis.com/auth/drive'
            ]
            creds = Credentials.from_service_account_file(
                self.credentials_path,
                scopes=scope
            )
            self.client = gspread.authorize(creds)
            print(f"✓ Successfully authenticated with Google Sheets API")
        except Exception as e:
            raise Exception(f"Authentication failed: {str(e)}")

    def extract_sheet_id(self, url: str) -> str:
        """Extract sheet ID from Google Sheets URL."""
        # Handle different URL formats
        # https://docs.google.com/spreadsheets/d/SHEET_ID/edit#gid=0
        # https://docs.google.com/spreadsheets/d/SHEET_ID/edit?usp=sharing
        try:
            parsed = urlparse(url)
            path_parts = parsed.path.split('/')
            if 'd' in path_parts:
                sheet_id = path_parts[path_parts.index('d') + 1]
                return sheet_id
            raise ValueError("Could not extract sheet ID from URL")
        except Exception as e:
            raise Exception(f"Invalid Google Sheets URL: {str(e)}")

    def open_sheet(self):
        """Open the Google Sheet and specific worksheet."""
        try:
            sheet_id = self.extract_sheet_id(self.sheet_url)
            spreadsheet = self.client.open_by_key(sheet_id)
            
            # Open the specific worksheet
            try:
                self.sheet = spreadsheet.worksheet(self.worksheet_name)
            except gspread.exceptions.WorksheetNotFound:
                raise Exception(f"Worksheet '{self.worksheet_name}' not found in the spreadsheet.")
            
            print(f"✓ Opened worksheet: {self.worksheet_name}")
        except Exception as e:
            raise Exception(f"Failed to open sheet: {str(e)}")

    def get_column_index(self, header_row: List[str], column_name: str) -> Optional[int]:
        """Get the index of a column by its header name."""
        try:
            return header_row.index(column_name) + 1  # gspread uses 1-based indexing
        except ValueError:
            return None

    def generate_slug(self, name: str) -> str:
        """
        Generate a URL-friendly slug from the name.
        Handles edge cases like:
        - "Gopal Reddy" -> "gopal-reddy"
        - "Ram charan" -> "ram-charan"
        - "R.  J Prabhas" -> "r-j-prabhas"
        - "A. Rupa" -> "a-rupa"
        """
        if not name:
            return ""
        
        # Convert to lowercase and strip
        slug = name.lower().strip()
        
        # Replace multiple spaces with single space
        slug = re.sub(r'\s+', ' ', slug)
        
        # Replace spaces and periods with hyphens
        slug = re.sub(r'[\s.]+', '-', slug)
        
        # Remove special characters, keep only alphanumeric and hyphens
        slug = re.sub(r'[^a-z0-9\-]', '', slug)
        
        # Remove multiple consecutive hyphens
        slug = re.sub(r'-+', '-', slug)
        
        # Remove leading/trailing hyphens
        slug = slug.strip('-')
        
        return slug


    def process_students(self, dry_run: bool = False) -> Dict:
        """
        Process all students in the sheet and generate slugs.

        Args:
            dry_run: If True, only print what would be updated without making changes

        Returns:
            Dictionary with processing statistics
        """
        if not self.sheet:
            raise Exception("Sheet not opened. Call open_sheet() first.")

        # Get all data
        all_values = self.sheet.get_all_values()
        if not all_values:
            print("⚠ Sheet is empty")
            return {"processed": 0, "updated": 0, "errors": 0}

        # Find header row (assume first row)
        headers = all_values[0]
        print(f"\n📋 Found columns: {', '.join(headers)}")

        # Find column indices (case-insensitive)
        name_col = None
        slug_col = None
        status_col = None
        
        for idx, header in enumerate(headers):
            header_lower = header.strip().lower()
            if header_lower == 'name':
                name_col = idx + 1
            elif header_lower == 'slug':
                slug_col = idx + 1
            elif header_lower == 'status':
                status_col = idx + 1

        if not name_col:
            raise Exception("'Name' column not found in the sheet")

        # Add slug column if it doesn't exist
        if not slug_col:
            print("⚠ 'slug' column not found. It will be added.")
            headers.append('slug')
            slug_col = len(headers)
            self.sheet.update('A1', [headers])
            print("✓ Added 'slug' column")

        # Add status column if it doesn't exist
        if not status_col:
            print("⚠ 'status' column not found. It will be added.")
            headers.append('status')
            status_col = len(headers)
            self.sheet.update('A1', [headers])
            print("✓ Added 'status' column")

        # Process each student (skip header row)
        processed = 0
        updated = 0
        errors = 0
        results = []

        print(f"\n🔄 Processing {len(all_values) - 1} student(s)...\n")

        for row_idx, row in enumerate(all_values[1:], start=2):  # Start from row 2
            if not row or not row[name_col - 1]:  # Skip empty rows
                continue

            name = row[name_col - 1].strip()
            if not name:
                continue

            try:
                # Generate slug
                slug = self.generate_slug(name)

                # Check current values
                current_slug = row[slug_col - 1].strip() if len(row) >= slug_col else ""
                current_status = row[status_col - 1].strip() if len(row) >= status_col else ""

                needs_update = False
                updates = []

                # Update slug if needed
                if current_slug != slug:
                    if dry_run:
                        print(f"  🔍 {name}: Would update slug to '{slug}'")
                    else:
                        self.sheet.update_cell(row_idx, slug_col, slug)
                        print(f"  ✓ {name}: Updated slug -> '{slug}'")
                    needs_update = True
                    updates.append("slug")

                # Update status if empty or needs update
                if not current_status or current_status.lower() != "completed":
                    new_status = "completed" if slug else ""
                    if new_status and current_status.lower() != new_status:
                        if dry_run:
                            print(f"  🔍 {name}: Would update status to '{new_status}'")
                        else:
                            self.sheet.update_cell(row_idx, status_col, new_status)
                            print(f"  ✓ {name}: Updated status -> '{new_status}'")
                        needs_update = True
                        updates.append("status")

                if not needs_update:
                    print(f"  ✓ {name}: Already up to date (slug: '{slug}')")

                if needs_update and not dry_run:
                    updated += 1

                results.append({
                    "name": name,
                    "slug": slug,
                    "status": "updated" if (needs_update and not dry_run) else ("would_update" if dry_run else "unchanged")
                })

                processed += 1

            except Exception as e:
                print(f"  ✗ {name}: Error - {str(e)}")
                errors += 1
                results.append({
                    "name": name,
                    "slug": None,
                    "status": "error",
                    "error": str(e)
                })

        summary = {
            "processed": processed,
            "updated": updated,
            "errors": errors,
            "results": results
        }

        print(f"\n📊 Summary:")
        print(f"   Processed: {processed}")
        print(f"   Updated: {updated}")
        print(f"   Errors: {errors}")

        return summary



def get_input(prompt: str, default: str = None) -> str:
    """
    Get user input with better paste support.
    Provides helpful instructions for pasting.
    """
    if default:
        prompt_text = f"{prompt} (default: {default}): "
    else:
        prompt_text = f"{prompt}: "
    
    print(prompt_text, end='', flush=True)
    
    # Try to read input
    try:
        user_input = input().strip()
    except (EOFError, KeyboardInterrupt):
        print("\n\n❌ Input cancelled by user")
        return None
    
    if not user_input and default:
        return default
    
    return user_input


def main():
    """Main function to run the script."""
    import sys
    
    print("=" * 60)
    print("  Google Sheets Slug Generator")
    print("=" * 60)
    print()
    
    # Check for command-line arguments as fallback
    sheet_url_arg = None
    worksheet_name_arg = None
    
    if len(sys.argv) > 1:
        if len(sys.argv) >= 3:
            sheet_url_arg = sys.argv[1]
            worksheet_name_arg = sys.argv[2]
            print("📋 Using command-line arguments:")
            print(f"   Sheet URL: {sheet_url_arg[:50]}...")
            print(f"   Worksheet: {worksheet_name_arg}")
            print()
        else:
            print("⚠️  Usage: python index.py [sheet_url] [worksheet_name]")
            print("   Or run without arguments for interactive mode")
            print()
    
    print("💡 Tip: To paste in PowerShell, use Right-click or Shift+Insert")
    print("   To paste in Command Prompt, use Right-click")
    print("   Or use: python index.py <sheet_url> <worksheet_name>")
    print()

    # Prompt for credentials file
    credentials_path = get_input("Enter path to credentials file", "credentials.json")
    if credentials_path is None:
        return 1
    if not credentials_path:
        credentials_path = 'credentials.json'

    # Validate credentials file exists
    if not os.path.exists(credentials_path):
        print(f"\n❌ Error: Credentials file not found: {credentials_path}")
        print("\nPlease:")
        print("1. Create a Google Service Account")
        print("2. Download the credentials JSON file")
        print("3. Share your Google Sheet with the service account email")
        print("4. Place the credentials file in the backend directory")
        return 1

    # Prompt for sheet URL (or use argument)
    if sheet_url_arg:
        sheet_url = sheet_url_arg
        print(f"✓ Using provided sheet URL")
    else:
        print()
        print("📋 Paste your Google Sheet URL below:")
        print("   Example: https://docs.google.com/spreadsheets/d/...")
        sheet_url = get_input("Enter Google Sheet URL")
        if sheet_url is None:
            return 1
        if not sheet_url:
            print("❌ Error: Sheet URL is required")
            return 1

    # Prompt for worksheet name (or use argument)
    if worksheet_name_arg:
        worksheet_name = worksheet_name_arg
        print(f"✓ Using provided worksheet name: {worksheet_name}")
    else:
        print()
        print("📄 Enter the name of the worksheet/tab (case-sensitive)")
        worksheet_name = get_input("Enter worksheet/tab name")
        if worksheet_name is None:
            return 1
        if not worksheet_name:
            print("❌ Error: Worksheet name is required")
            return 1

    # Ask for dry run
    print()
    dry_run_input = get_input("Run in dry-run mode? (y/N)", "N")
    if dry_run_input is None:
        return 1
    dry_run = dry_run_input.lower() in ['y', 'yes']

    try:
        # Initialize generator
        generator = SlugGenerator(
            credentials_path=credentials_path,
            sheet_url=sheet_url,
            worksheet_name=worksheet_name
        )

        # Authenticate
        print("\n🔐 Authenticating...")
        generator.authenticate()

        # Open sheet
        print("\n📂 Opening sheet...")
        generator.open_sheet()

        # Process students
        if dry_run:
            print("\n🔍 DRY RUN MODE - No changes will be made\n")
        else:
            print("\n🚀 Processing students...\n")

        summary = generator.process_students(dry_run=dry_run)

        print("\n✅ Done!")

    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        return 1

    return 0


if __name__ == '__main__':
    exit(main())

