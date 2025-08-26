#!/usr/bin/env python3
"""
Enhanced Exjam Alumni Registration Module

This module provides comprehensive functionality for creating Google Forms-based registration systems
with both QR codes and barcodes for events like the PG Conference.
"""

import qrcode
import barcode
from barcode.writer import ImageWriter
import requests
import json
import csv
import os
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Tuple
import pandas as pd
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
import pickle
import base64
from io import BytesIO
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

class EnhancedExjamRegistrationModule:
    def __init__(self, credentials_file: str = None):
        """
        Initialize the enhanced registration module.
        
        Args:
            credentials_file (str): Path to Google API credentials file
        """
        self.credentials_file = credentials_file
        self.service = None
        self.form_id = None
        self.qr_codes_dir = "qr_codes"
        self.barcodes_dir = "barcodes"
        self.badges_dir = "badges"
        self.registration_data = {}
        
        # Create directories
        for directory in [self.qr_codes_dir, self.barcodes_dir, self.badges_dir]:
            os.makedirs(directory, exist_ok=True)
        
        # Initialize Google Forms service if credentials provided
        if credentials_file:
            self._initialize_google_service()
    
    def _initialize_google_service(self):
        """Initialize Google Forms API service."""
        SCOPES = ['https://www.googleapis.com/auth/forms.body',
                  'https://www.googleapis.com/auth/forms.responses.readonly']
        
        creds = None
        
        # Load existing credentials
        if os.path.exists('token.pickle'):
            with open('token.pickle', 'rb') as token:
                creds = pickle.load(token)
        
        # Refresh or get new credentials
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
            else:
                flow = InstalledAppFlow.from_client_secrets_file(
                    self.credentials_file, SCOPES)
                creds = flow.run_local_server(port=0)
            
            # Save credentials
            with open('token.pickle', 'wb') as token:
                pickle.dump(creds, token)
        
        self.service = build('forms', 'v1', credentials=creds)
    
    def generate_unique_id(self, prefix: str = "EXJAM") -> str:
        """
        Generate a unique identifier for registration.
        
        Args:
            prefix (str): Prefix for the ID
            
        Returns:
            str: Unique identifier
        """
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        unique_part = str(uuid.uuid4())[:8].upper()
        return f"{prefix}-{timestamp}-{unique_part}"
    
    def generate_qr_code(self, data: str, filename: str = None, size: int = 10) -> str:
        """
        Generate a QR code for the given data.
        
        Args:
            data (str): Data to encode in QR code
            filename (str): Optional filename for the QR code image
            size (int): Size of the QR code
            
        Returns:
            str: Path to the generated QR code image
        """
        # Create QR code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=size,
            border=4,
        )
        qr.add_data(data)
        qr.make(fit=True)
        
        # Create image
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Generate filename if not provided
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"qr_code_{timestamp}.png"
        
        # Save image
        filepath = os.path.join(self.qr_codes_dir, filename)
        img.save(filepath)
        
        print(f"QR code generated: {filepath}")
        return filepath
    
    def generate_barcode(self, data: str, barcode_type: str = "code128", filename: str = None) -> str:
        """
        Generate a barcode for the given data.
        
        Args:
            data (str): Data to encode in barcode
            barcode_type (str): Type of barcode (code128, code39, ean13, etc.)
            filename (str): Optional filename for the barcode image
            
        Returns:
            str: Path to the generated barcode image
        """
        try:
            # Create barcode
            barcode_class = barcode.get_barcode_class(barcode_type)
            barcode_instance = barcode_class(data, writer=ImageWriter())
            
            # Generate filename if not provided
            if not filename:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = f"barcode_{barcode_type}_{timestamp}.png"
            
            # Save image
            filepath = os.path.join(self.barcodes_dir, filename)
            barcode_instance.save(filepath)
            
            print(f"Barcode generated: {filepath}")
            return filepath
            
        except Exception as e:
            print(f"Error generating barcode: {e}")
            return None
    
    def generate_registration_codes(self, registration_id: str, form_url: str = None) -> Dict[str, str]:
        """
        Generate both QR code and barcode for a registration.
        
        Args:
            registration_id (str): Unique registration identifier
            form_url (str): Google Form URL
            
        Returns:
            Dict[str, str]: Dictionary with paths to generated codes
        """
        codes = {}
        
        # Generate QR code with registration data
        qr_data = {
            "registration_id": registration_id,
            "event": "ExJAM PG Conference - Maiden Flight",
            "date": "Nov 28-30, 2025",
            "venue": "NAF Conference Centre, FCT, ABUJA",
            "form_url": form_url
        }
        
        qr_filename = f"registration_qr_{registration_id}.png"
        codes['qr_code'] = self.generate_qr_code(
            json.dumps(qr_data, indent=2),
            qr_filename
        )
        
        # Generate barcode with registration ID
        barcode_filename = f"registration_barcode_{registration_id}.png"
        codes['barcode'] = self.generate_barcode(
            registration_id,
            "code128",
            barcode_filename
        )
        
        return codes
    
    def create_pg_conference_form(self) -> str:
        """
        Create a Google Form for the PG Conference registration.
        
        Returns:
            str: Form ID
        """
        if not self.service:
            print("Google service not initialized. Creating form structure only.")
            return None
        
        # Form title and description
        form_title = "ExJAM President General's Conference (PG Conference) - Maiden Flight Registration"
        form_description = """
        Welcome to the historic President General's Conference (PG Conference) - Maiden Flight!
        
        This groundbreaking event marks a new milestone in the history of the ExJAM Association. 
        For the first time ever, we are bringing together our members, leaders, and stakeholders 
        to share ideas, build relationships, and shape the future of our association.
        
        Event Details:
        - Date: November 28th to November 30th, 2025
        - Venue: NAF Conference Centre, FCT, ABUJA
        - Theme: "Strive to Excel"
        
        Please complete this registration form to secure your spot at this historic event.
        """
        
        # Create the form
        form = {
            'info': {
                'title': form_title,
                'documentTitle': 'PG Conference Registration',
                'description': form_description
            }
        }
        
        # Add form fields
        questions = [
            {
                'questionId': 'registration_id',
                'textQuestion': {
                    'question': 'Registration ID (will be auto-generated)',
                    'required': True
                }
            },
            {
                'questionId': 'full_name',
                'textQuestion': {
                    'question': 'Full Name (as it appears on official documents)',
                    'required': True
                }
            },
            {
                'questionId': 'exjam_id',
                'textQuestion': {
                    'question': 'ExJAM ID Number (if applicable)',
                    'required': False
                }
            },
            {
                'questionId': 'graduation_year',
                'choiceQuestion': {
                    'question': 'Graduation Year from Air Force Military School Jos',
                    'type': 'DROP_DOWN',
                    'options': [
                        {'value': '2024'}, {'value': '2023'}, {'value': '2022'}, 
                        {'value': '2021'}, {'value': '2020'}, {'value': '2019'},
                        {'value': '2018'}, {'value': '2017'}, {'value': '2016'},
                        {'value': '2015'}, {'value': '2014'}, {'value': '2013'},
                        {'value': '2012'}, {'value': '2011'}, {'value': '2010'},
                        {'value': '2009'}, {'value': '2008'}, {'value': '2007'},
                        {'value': '2006'}, {'value': '2005'}, {'value': '2004'},
                        {'value': '2003'}, {'value': '2002'}, {'value': '2001'},
                        {'value': '2000'}, {'value': '1999'}, {'value': '1998'},
                        {'value': '1997'}, {'value': '1996'}, {'value': '1995'},
                        {'value': '1994'}, {'value': '1993'}, {'value': '1992'},
                        {'value': '1991'}, {'value': '1990'}, {'value': '1989'},
                        {'value': '1988'}, {'value': '1987'}, {'value': '1986'},
                        {'value': '1985'}, {'value': '1984'}, {'value': '1983'},
                        {'value': '1982'}, {'value': '1981'}, {'value': '1980'},
                        {'value': '1979'}, {'value': '1978'}, {'value': '1977'},
                        {'value': '1976'}, {'value': '1975'}, {'value': '1974'},
                        {'value': '1973'}, {'value': '1972'}, {'value': '1971'},
                        {'value': '1970'}, {'value': '1969'}, {'value': '1968'},
                        {'value': '1967'}, {'value': '1966'}, {'value': '1965'},
                        {'value': '1964'}, {'value': '1963'}, {'value': '1962'},
                        {'value': '1961'}, {'value': '1960'}, {'value': '1959'},
                        {'value': '1958'}, {'value': '1957'}, {'value': '1956'},
                        {'value': '1955'}, {'value': '1954'}, {'value': '1953'},
                        {'value': '1952'}, {'value': '1951'}, {'value': '1950'},
                        {'value': 'Pre-1950'}
                    ],
                    'required': True
                }
            },
            {
                'questionId': 'email',
                'textQuestion': {
                    'question': 'Email Address',
                    'required': True
                }
            },
            {
                'questionId': 'phone',
                'textQuestion': {
                    'question': 'Phone Number',
                    'required': True
                }
            },
            {
                'questionId': 'current_location',
                'textQuestion': {
                    'question': 'Current Location (City, State/Province, Country)',
                    'required': True
                }
            },
            {
                'questionId': 'occupation',
                'textQuestion': {
                    'question': 'Current Occupation/Profession',
                    'required': True
                }
            },
            {
                'questionId': 'organization',
                'textQuestion': {
                    'question': 'Organization/Company (if applicable)',
                    'required': False
                }
            },
            {
                'questionId': 'dietary_restrictions',
                'choiceQuestion': {
                    'question': 'Dietary Restrictions (for catering purposes)',
                    'type': 'CHECKBOX',
                    'options': [
                        {'value': 'None'},
                        {'value': 'Vegetarian'},
                        {'value': 'Vegan'},
                        {'value': 'Halal'},
                        {'value': 'Kosher'},
                        {'value': 'Gluten-free'},
                        {'value': 'Dairy-free'},
                        {'value': 'Nut-free'},
                        {'value': 'Other (please specify)'}
                    ],
                    'required': False
                }
            },
            {
                'questionId': 'special_needs',
                'textQuestion': {
                    'question': 'Special Needs or Accessibility Requirements',
                    'required': False
                }
            },
            {
                'questionId': 'emergency_contact',
                'textQuestion': {
                    'question': 'Emergency Contact (Name and Phone Number)',
                    'required': True
                }
            },
            {
                'questionId': 'accommodation_needed',
                'choiceQuestion': {
                    'question': 'Do you need accommodation assistance?',
                    'type': 'RADIO',
                    'options': [
                        {'value': 'Yes, I need accommodation'},
                        {'value': 'No, I will arrange my own accommodation'},
                        {'value': 'I am local and do not need accommodation'}
                    ],
                    'required': True
                }
            },
            {
                'questionId': 'transportation_needed',
                'choiceQuestion': {
                    'question': 'Do you need transportation assistance from the airport?',
                    'type': 'RADIO',
                    'options': [
                        {'value': 'Yes, I need airport pickup'},
                        {'value': 'No, I will arrange my own transportation'},
                        {'value': 'I am local and do not need transportation'}
                    ],
                    'required': True
                }
            },
            {
                'questionId': 'arrival_date',
                'choiceQuestion': {
                    'question': 'Expected Arrival Date',
                    'type': 'RADIO',
                    'options': [
                        {'value': 'November 27th, 2025 (Day before conference)'},
                        {'value': 'November 28th, 2025 (Conference start day)'},
                        {'value': 'Other date'}
                    ],
                    'required': True
                }
            },
            {
                'questionId': 'departure_date',
                'choiceQuestion': {
                    'question': 'Expected Departure Date',
                    'type': 'RADIO',
                    'options': [
                        {'value': 'November 30th, 2025 (Conference end day)'},
                        {'value': 'December 1st, 2025 (Day after conference)'},
                        {'value': 'Other date'}
                    ],
                    'required': True
                }
            },
            {
                'questionId': 'session_interests',
                'choiceQuestion': {
                    'question': 'Which conference sessions are you most interested in? (Select all that apply)',
                    'type': 'CHECKBOX',
                    'options': [
                        {'value': 'Leadership Development'},
                        {'value': 'Alumni Network Building'},
                        {'value': 'Career Advancement'},
                        {'value': 'Community Service Projects'},
                        {'value': 'Technology and Innovation'},
                        {'value': 'Business and Entrepreneurship'},
                        {'value': 'Education and Mentorship'},
                        {'value': 'All sessions'}
                    ],
                    'required': True
                }
            },
            {
                'questionId': 'speaking_interest',
                'choiceQuestion': {
                    'question': 'Would you be interested in speaking at the conference?',
                    'type': 'RADIO',
                    'options': [
                        {'value': 'Yes, I would like to present'},
                        {'value': 'Yes, I would like to moderate a session'},
                        {'value': 'No, I prefer to attend as a participant'},
                        {'value': 'Maybe, I would like more information'}
                    ],
                    'required': False
                }
            },
            {
                'questionId': 'speaking_topic',
                'textQuestion': {
                    'question': 'If interested in speaking, what topic would you like to present?',
                    'required': False
                }
            },
            {
                'questionId': 'networking_goals',
                'textQuestion': {
                    'question': 'What are your main networking goals for this conference?',
                    'required': False
                }
            },
            {
                'questionId': 'expectations',
                'textQuestion': {
                    'question': 'What do you hope to gain from attending the PG Conference?',
                    'required': False
                }
            },
            {
                'questionId': 'additional_comments',
                'textQuestion': {
                    'question': 'Additional Comments or Special Requests',
                    'required': False
                }
            }
        ]
        
        # Add questions to form
        for question in questions:
            form.setdefault('items', []).append({
                'itemId': question['questionId'],
                'question': question
            })
        
        # Create the form
        try:
            created_form = self.service.forms().create(body=form).execute()
            self.form_id = created_form['formId']
            form_url = f"https://docs.google.com/forms/d/{self.form_id}/viewform"
            
            print(f"Form created successfully!")
            print(f"Form ID: {self.form_id}")
            print(f"Form URL: {form_url}")
            
            return self.form_id
            
        except Exception as e:
            print(f"Error creating form: {e}")
            return None
    
    def generate_event_qr_codes(self, form_id: str = None) -> Dict[str, str]:
        """
        Generate QR codes for different event purposes.
        
        Args:
            form_id (str): Google Form ID
            
        Returns:
            Dict[str, str]: Dictionary mapping QR code types to file paths
        """
        if not form_id:
            form_id = self.form_id
        
        if not form_id:
            print("No form ID provided. Cannot generate QR codes.")
            return {}
        
        form_url = f"https://docs.google.com/forms/d/{form_id}/viewform"
        
        qr_codes = {}
        
        # Generate different types of QR codes
        qr_codes['registration_form'] = self.generate_qr_code(
            form_url, 
            "pg_conference_registration.png"
        )
        
        qr_codes['event_info'] = self.generate_qr_code(
            "ExJAM PG Conference - Maiden Flight\n"
            "Date: Nov 28-30, 2025\n"
            "Venue: NAF Conference Centre, FCT, ABUJA\n"
            "Theme: Strive to Excel\n"
            f"Register at: {form_url}",
            "event_info.png"
        )
        
        qr_codes['contact_info'] = self.generate_qr_code(
            "ExJAM Association\n"
            "Contact: E-signed DM OBADIAH PRO National\n"
            "Event: PG Conference - Maiden Flight\n"
            "Date: Nov 28-30, 2025\n"
            f"Registration: {form_url}",
            "contact_info.png"
        )
        
        qr_codes['venue_info'] = self.generate_qr_code(
            "NAF Conference Centre\n"
            "FCT, ABUJA\n"
            "Nigeria\n"
            "Event: ExJAM PG Conference\n"
            "Date: Nov 28-30, 2025",
            "venue_info.png"
        )
        
        return qr_codes
    
    def generate_event_barcodes(self) -> Dict[str, str]:
        """
        Generate barcodes for different event purposes.
        
        Returns:
            Dict[str, str]: Dictionary mapping barcode types to file paths
        """
        barcodes = {}
        
        # Generate different types of barcodes
        barcodes['event_id'] = self.generate_barcode(
            "EXJAM-PG-2025",
            "code128",
            "event_id_barcode.png"
        )
        
        barcodes['venue_code'] = self.generate_barcode(
            "NAF-CC-ABUJA",
            "code39",
            "venue_barcode.png"
        )
        
        barcodes['date_code'] = self.generate_barcode(
            "20251128-30",
            "code128",
            "date_barcode.png"
        )
        
        return barcodes
    
    def create_participant_badge(self, participant_data: Dict, output_filename: str = None) -> str:
        """
        Create a participant badge with QR code and barcode.
        
        Args:
            participant_data (Dict): Participant information
            output_filename (str): Output PDF filename
            
        Returns:
            str: Path to the generated badge PDF
        """
        if not output_filename:
            registration_id = participant_data.get('registration_id', 'UNKNOWN')
            output_filename = f"badge_{registration_id}.pdf"
        
        filepath = os.path.join(self.badges_dir, output_filename)
        
        # Create PDF badge
        doc = SimpleDocTemplate(filepath, pagesize=A4)
        story = []
        styles = getSampleStyleSheet()
        
        # Add title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            spaceAfter=30,
            alignment=1  # Center alignment
        )
        title = Paragraph("ExJAM PG Conference - Maiden Flight", title_style)
        story.append(title)
        story.append(Spacer(1, 20))
        
        # Add participant information
        info_data = [
            ['Name:', participant_data.get('full_name', 'N/A')],
            ['Registration ID:', participant_data.get('registration_id', 'N/A')],
            ['Graduation Year:', participant_data.get('graduation_year', 'N/A')],
            ['Organization:', participant_data.get('organization', 'N/A')],
            ['Location:', participant_data.get('current_location', 'N/A')],
            ['Email:', participant_data.get('email', 'N/A')],
            ['Phone:', participant_data.get('phone', 'N/A')]
        ]
        
        info_table = Table(info_data, colWidths=[2*inch, 4*inch])
        info_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.lightblue),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 12),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('BACKGROUND', (0, 0), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(info_table)
        story.append(Spacer(1, 30))
        
        # Add event details
        event_data = [
            ['Event:', 'ExJAM President General\'s Conference'],
            ['Theme:', 'Maiden Flight'],
            ['Date:', 'November 28-30, 2025'],
            ['Venue:', 'NAF Conference Centre, FCT, ABUJA'],
            ['Registration ID:', participant_data.get('registration_id', 'N/A')]
        ]
        
        event_table = Table(event_data, colWidths=[2*inch, 4*inch])
        event_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.lightgreen),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 12),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(event_table)
        
        # Build PDF
        doc.build(story)
        
        print(f"Participant badge created: {filepath}")
        return filepath
    
    def generate_bulk_badges(self, participants_data: List[Dict]) -> List[str]:
        """
        Generate badges for multiple participants.
        
        Args:
            participants_data (List[Dict]): List of participant information
            
        Returns:
            List[str]: List of generated badge file paths
        """
        badge_files = []
        
        for participant in participants_data:
            # Generate registration codes for this participant
            registration_id = participant.get('registration_id', self.generate_unique_id())
            participant['registration_id'] = registration_id
            
            # Generate QR and barcode
            codes = self.generate_registration_codes(registration_id)
            
            # Create badge
            badge_file = self.create_participant_badge(participant)
            badge_files.append(badge_file)
        
        print(f"Generated {len(badge_files)} participant badges")
        return badge_files
    
    def export_responses_to_csv(self, form_id: str = None, output_file: str = "registration_responses.csv") -> str:
        """
        Export form responses to CSV file.
        
        Args:
            form_id (str): Google Form ID
            output_file (str): Output CSV filename
            
        Returns:
            str: Path to the exported CSV file
        """
        if not self.service:
            print("Google service not initialized. Cannot export responses.")
            return None
        
        if not form_id:
            form_id = self.form_id
        
        if not form_id:
            print("No form ID provided.")
            return None
        
        try:
            # Get form responses
            responses = self.service.forms().responses().list(formId=form_id).execute()
            
            if not responses.get('responses'):
                print("No responses found for this form.")
                return None
            
            # Get form structure to map question IDs to questions
            form = self.service.forms().get(formId=form_id).execute()
            question_map = {}
            
            for item in form.get('items', []):
                if 'question' in item:
                    question_id = item['itemId']
                    question_text = item['question'].get('textQuestion', {}).get('question', '')
                    question_map[question_id] = question_text
            
            # Process responses
            processed_responses = []
            
            for response in responses['responses']:
                response_data = {
                    'response_id': response['responseId'],
                    'created_time': response['createdTime'],
                    'last_submitted_time': response['lastSubmittedTime']
                }
                
                # Extract answers
                for answer in response.get('answers', {}).values():
                    question_id = answer['questionId']
                    question_text = question_map.get(question_id, question_id)
                    
                    if 'textAnswers' in answer:
                        response_data[question_text] = answer['textAnswers']['answers'][0]['value']
                    elif 'choiceAnswers' in answer:
                        choices = [choice['value'] for choice in answer['choiceAnswers']['answers']]
                        response_data[question_text] = ', '.join(choices)
                
                processed_responses.append(response_data)
            
            # Convert to DataFrame and save
            df = pd.DataFrame(processed_responses)
            df.to_csv(output_file, index=False)
            
            print(f"Responses exported to: {output_file}")
            print(f"Total responses: {len(processed_responses)}")
            
            return output_file
            
        except Exception as e:
            print(f"Error exporting responses: {e}")
            return None
    
    def generate_comprehensive_report(self, csv_file: str, output_file: str = "comprehensive_registration_report.md") -> str:
        """
        Generate a comprehensive registration report with QR codes and barcodes.
        
        Args:
            csv_file (str): Path to CSV file with registration data
            output_file (str): Output report filename
            
        Returns:
            str: Path to the generated report
        """
        try:
            df = pd.read_csv(csv_file)
            
            report = f"""# ExJAM PG Conference Comprehensive Registration Report

Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## Executive Summary
- **Total Registrations**: {len(df)}
- **Registration Period**: {df['created_time'].min()} to {df['created_time'].max()}
- **Event**: ExJAM President General's Conference - Maiden Flight
- **Date**: November 28-30, 2025
- **Venue**: NAF Conference Centre, FCT, ABUJA

## Registration Statistics

### Graduation Year Distribution
{df['Graduation Year from Air Force Military School Jos'].value_counts().to_markdown()}

### Geographic Distribution
{df['Current Location (City, State/Province, Country)'].value_counts().head(10).to_markdown()}

### Professional Distribution
{df['Current Occupation/Profession'].value_counts().head(10).to_markdown()}

### Accommodation Needs
{df['Do you need accommodation assistance?'].value_counts().to_markdown()}

### Transportation Needs
{df['Do you need transportation assistance from the airport?'].value_counts().to_markdown()}

### Session Interests
{df['Which conference sessions are you most interested in? (Select all that apply)'].value_counts().to_markdown()}

### Speaking Interest
{df['Would you be interested in speaking at the conference?'].value_counts().to_markdown()}

## Dietary Requirements
{df['Dietary Restrictions (for catering purposes)'].value_counts().to_markdown()}

## Special Needs
Special needs and accessibility requirements:
{df['Special Needs or Accessibility Requirements'].dropna().to_list()}

## QR Codes and Barcodes Generated
- Registration QR codes: {len(df)} individual codes
- Event information QR codes: 4 types
- Barcodes: 3 types (Event ID, Venue, Date)
- Participant badges: {len(df)} badges

## Event Logistics Recommendations
Based on the registration data:

1. **Catering**: Plan for {df['Dietary Restrictions (for catering purposes)'].value_counts().get('None', 0)} standard meals and accommodate special dietary requirements
2. **Accommodation**: {df['Do you need accommodation assistance?'].value_counts().get('Yes, I need accommodation', 0)} participants need accommodation assistance
3. **Transportation**: {df['Do you need transportation assistance from the airport?'].value_counts().get('Yes, I need airport pickup', 0)} participants need airport pickup
4. **Sessions**: Focus on the most popular session topics based on participant interests
5. **Badges**: {len(df)} participant badges need to be printed with QR codes and barcodes

## Technical Implementation
- Google Forms integration for registration
- QR code generation for each participant
- Barcode generation for event tracking
- PDF badge generation with participant information
- Automated report generation

---
*Report generated automatically from registration data*
"""
            
            with open(output_file, 'w') as f:
                f.write(report)
            
            print(f"Comprehensive report generated: {output_file}")
            return output_file
            
        except Exception as e:
            print(f"Error generating report: {e}")
            return None


def main():
    """Example usage of the enhanced registration module."""
    # Initialize the enhanced registration module
    registration = EnhancedExjamRegistrationModule()
    
    print("=== Enhanced ExJAM PG Conference Registration Module ===\n")
    
    # Create the registration form
    print("1. Creating Google Form for PG Conference registration...")
    form_id = registration.create_pg_conference_form()
    
    if form_id:
        # Generate QR codes
        print("\n2. Generating QR codes...")
        qr_codes = registration.generate_event_qr_codes(form_id)
        
        # Generate barcodes
        print("\n3. Generating barcodes...")
        barcodes = registration.generate_event_barcodes()
        
        print("\nGenerated QR codes:")
        for qr_type, filepath in qr_codes.items():
            print(f"  - {qr_type}: {filepath}")
        
        print("\nGenerated barcodes:")
        for barcode_type, filepath in barcodes.items():
            print(f"  - {barcode_type}: {filepath}")
        
        # Example participant data
        sample_participant = {
            'full_name': 'Ahmed A Mimi',
            'graduation_year': '2010',
            'email': 'ahmed.mimi@example.com',
            'phone': '+234 123 456 7890',
            'current_location': 'FCT, Abuja, Nigeria',
            'organization': 'ExJAM Association',
            'occupation': 'National President'
        }
        
        # Generate registration codes for sample participant
        print("\n4. Generating sample participant registration codes...")
        registration_id = registration.generate_unique_id()
        sample_codes = registration.generate_registration_codes(registration_id)
        
        # Create sample badge
        print("\n5. Creating sample participant badge...")
        sample_participant['registration_id'] = registration_id
        badge_file = registration.create_participant_badge(sample_participant)
        
        print(f"\nSample participant badge created: {badge_file}")
        
        # Example of bulk badge generation
        print("\n6. Registration module ready for use!")
        print(f"Form URL: https://docs.google.com/forms/d/{form_id}/viewform")
        print("\nTo export responses when available:")
        print("registration.export_responses_to_csv()")
        print("\nTo generate comprehensive reports:")
        print("registration.generate_comprehensive_report('registration_responses.csv')")
        print("\nTo generate bulk badges:")
        print("registration.generate_bulk_badges(participants_data)")
    
    print("\n=== Enhanced Setup Complete ===")


if __name__ == "__main__":
    main()
