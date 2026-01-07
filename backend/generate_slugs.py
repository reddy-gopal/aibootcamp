"""
Google Sheets Slug and Pass URL Generator

This script:
1. Connects to a Google Sheet with student data
2. Generates slugs from student names (lowercase with hyphens)
3. Updates the Slug column
4. Generates pass URLs in format: https://yourfrontend.com/pass/{slug}
5. Updates the Pass URL column

Required columns in Google Sheet:
- Name
- AI BOOTCAMP (workshop name)
- Slug (will be populated by this script)
- Pass URL (will be populated by this script)
"""

import gspread
from google.oauth2.service_account import Credentials
import os
import re
import json
from typing import List, Dict, Optional


class SlugGenerator:
    def __init__(self, credentials_path: str, sheet_name: str, base_url: str):
        """
        Initialize the Slug Generator.

        Args:
            credentials_path: Path to Google Service Account JSON credentials file
            sheet_name: Name of the Google Sheet to process
            base_url: Base URL for the pass pages (e.g., 'https://yourfrontend.com')
        """
        self.credentials_path = credentials_path
        self.sheet_name = sheet_name
        self.base_url = base_url.rstrip('/')
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

    def open_sheet(self):
        """Open the Google Sheet."""
        try:
            self.sheet = self.client.open(self.sheet_name).sheet1
            print(f"✓ Opened sheet: {self.sheet_name}")
        except gspread.exceptions.SpreadsheetNotFound:
            raise Exception(f"Sheet '{self.sheet_name}' not found. Please check the sheet name.")
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
        Example: "Rahul Sharma" -> "rahul-sharma"
        """
        # Convert to lowercase
        slug = name.lower().strip()
        # Replace spaces with hyphens
        slug = slug.replace(' ', '-')
        # Remove special characters, keep only alphanumeric and hyphens
        slug = re.sub(r'[^a-z0-9\-]', '', slug)
        # Remove multiple consecutive hyphens
        slug = re.sub(r'-+', '-', slug)
        # Remove leading/trailing hyphens
        slug = slug.strip('-')
        return slug

    def generate_pass_url(self, slug: str) -> str:
        """Generate a pass URL for a student."""
        return f"{self.base_url}/pass/{slug}"

    def process_students(self, dry_run: bool = False) -> Dict:
        """
        Process all students in the sheet and generate slugs and pass URLs.

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

        # Find column indices
        name_col = self.get_column_index(headers, 'Name')
        slug_col = self.get_column_index(headers, 'Slug')
        pass_url_col = self.get_column_index(headers, 'Pass URL')

        if not name_col:
            raise Exception("'Name' column not found in the sheet")

        # Add Slug column if it doesn't exist
        if not slug_col:
            print("⚠ 'Slug' column not found. It will be added.")
            headers.append('Slug')
            slug_col = len(headers)
            self.sheet.update('A1', [headers])
            print("✓ Added 'Slug' column")

        # Add Pass URL column if it doesn't exist
        if not pass_url_col:
            print("⚠ 'Pass URL' column not found. It will be added.")
            headers.append('Pass URL')
            pass_url_col = len(headers)
            self.sheet.update('A1', [headers])
            print("✓ Added 'Pass URL' column")

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
                # Generate slug and pass URL
                slug = self.generate_slug(name)
                pass_url = self.generate_pass_url(slug)

                # Check current values
                current_slug = row[slug_col - 1].strip() if len(row) >= slug_col else ""
                current_url = row[pass_url_col - 1].strip() if len(row) >= pass_url_col else ""

                needs_update = False
                updates = []

                # Update slug if needed
                if current_slug != slug:
                    if dry_run:
                        print(f"  🔍 {name}: Would update Slug to '{slug}'")
                    else:
                        self.sheet.update_cell(row_idx, slug_col, slug)
                        print(f"  ✓ {name}: Updated Slug -> '{slug}'")
                    needs_update = True
                    updates.append("slug")

                # Update pass URL if needed
                if current_url != pass_url:
                    if dry_run:
                        print(f"  🔍 {name}: Would update Pass URL to '{pass_url}'")
                    else:
                        self.sheet.update_cell(row_idx, pass_url_col, pass_url)
                        print(f"  ✓ {name}: Updated Pass URL -> '{pass_url}'")
                    needs_update = True
                    updates.append("url")

                if not needs_update:
                    print(f"  ✓ {name}: Already up to date")

                if needs_update and not dry_run:
                    updated += 1

                results.append({
                    "name": name,
                    "slug": slug,
                    "url": pass_url,
                    "status": "updated" if (needs_update and not dry_run) else ("would_update" if dry_run else "unchanged")
                })

                processed += 1

            except Exception as e:
                print(f"  ✗ {name}: Error - {str(e)}")
                errors += 1
                results.append({
                    "name": name,
                    "slug": None,
                    "url": None,
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

    def export_to_json(self, output_path: str = "students.json"):
        """
        Export student data to a JSON file for the frontend.

        Args:
            output_path: Path to save the JSON file
        """
        if not self.sheet:
            raise Exception("Sheet not opened. Call open_sheet() first.")

        all_values = self.sheet.get_all_values()
        if not all_values:
            print("⚠ Sheet is empty")
            return

        headers = all_values[0]
        name_col = self.get_column_index(headers, 'Name')
        workshop_col = self.get_column_index(headers, 'AI BOOTCAMP')
        slug_col = self.get_column_index(headers, 'Slug')
        pass_url_col = self.get_column_index(headers, 'Pass URL')

        students = []
        for row in all_values[1:]:
            if not row or not row[name_col - 1]:
                continue

            name = row[name_col - 1].strip()
            if not name:
                continue

            slug = row[slug_col - 1].strip() if slug_col and len(row) >= slug_col else self.generate_slug(name)
            pass_url = row[pass_url_col - 1].strip() if pass_url_col and len(row) >= pass_url_col else self.generate_pass_url(slug)

            student = {
                "name": name,
                "slug": slug,
                "workshop": row[workshop_col - 1].strip() if workshop_col and len(row) >= workshop_col else "",
                "date": "",  # Date column not specified in requirements
                "passUrl": pass_url
            }
            students.append(student)

        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(students, f, indent=2, ensure_ascii=False)

        print(f"✓ Exported {len(students)} students to {output_path}")


def main():
    """Main function to run the script."""
    import argparse

    parser = argparse.ArgumentParser(
        description='Generate slugs and pass URLs for students from Google Sheets'
    )
    parser.add_argument(
        '--credentials',
        type=str,
        default='credentials.json',
        help='Path to Google Service Account credentials JSON file'
    )
    parser.add_argument(
        '--sheet',
        type=str,
        required=True,
        help='Name of the Google Sheet to process'
    )
    parser.add_argument(
        '--base-url',
        type=str,
        required=True,
        help='Base URL for pass pages (e.g., https://yourfrontend.com)'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Run without making changes to the sheet'
    )
    parser.add_argument(
        '--export-json',
        type=str,
        help='Export student data to JSON file (optional)'
    )

    args = parser.parse_args()

    # Validate credentials file exists
    if not os.path.exists(args.credentials):
        print(f"❌ Error: Credentials file not found: {args.credentials}")
        print("\nPlease:")
        print("1. Create a Google Service Account")
        print("2. Download the credentials JSON file")
        print("3. Share your Google Sheet with the service account email")
        print("4. Place the credentials file in the backend directory")
        return 1

    try:
        # Initialize generator
        generator = SlugGenerator(
            credentials_path=args.credentials,
            sheet_name=args.sheet,
            base_url=args.base_url
        )

        # Authenticate
        generator.authenticate()

        # Open sheet
        generator.open_sheet()

        # Process students
        if args.dry_run:
            print("\n🔍 DRY RUN MODE - No changes will be made\n")
        else:
            print("\n🚀 Processing students...\n")

        summary = generator.process_students(dry_run=args.dry_run)

        # Export to JSON if requested
        if args.export_json:
            generator.export_to_json(args.export_json)

        print("\n✅ Done!")

    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        return 1

    return 0


if __name__ == '__main__':
    exit(main())

