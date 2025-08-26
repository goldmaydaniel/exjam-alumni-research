#!/usr/bin/env python3
"""
Exjam Alumni Registration Module

This module provides functionality for creating Google Forms-based registration systems
with QR code generation for events like the PG Conference.
"""

import qrcode
import requests
import json
import csv
import os
from datetime import datetime
from typing import Dict, List, Optional
import pandas as pd
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
import pickle
import base64
from io import BytesIO

class ExjamRegistrationModule:
    def __init__(self, credentials_file: str = None):
        """
        Initialize the registration module.
        
        Args:
            credentials_file (str): Path to Google API credentials file
        """
        self.credentials_file = credentials_file
        self.service = None
        self.form_id = None
        self.qr_codes_dir = "qr_codes"
        
        # Create QR codes directory
        os.makedirs(self.qr_codes_dir, exist_ok=True)
        
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
                'questionId': 'personal_info',
                'textQuestion': {
                    'question': 'Personal Information',
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
    
    def generate_qr_code(self, data: str, filename: str = None) -> str:
        """
        Generate a QR code for the given data.
        
        Args:
            data (str): Data to encode in QR code
            filename (str): Optional filename for the QR code image
            
        Returns:
            str: Path to the generated QR code image
        """
        # Create QR code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
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
    
    def generate_registration_qr_codes(self, form_id: str = None) -> Dict[str, str]:
        """
        Generate QR codes for different registration purposes.
        
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
            f"Register at: {form_url}",
            "event_info.png"
        )
        
        qr_codes['contact_info'] = self.generate_qr_code(
            "ExJAM Association\n"
            "Contact: E-signed DM OBADIAH PRO National\n"
            "Email: [contact email]\n"
            "Phone: [contact phone]\n"
            f"Registration: {form_url}",
            "contact_info.png"
        )
        
        return qr_codes
    
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
    
    def generate_registration_report(self, csv_file: str, output_file: str = "registration_report.md") -> str:
        """
        Generate a comprehensive registration report.
        
        Args:
            csv_file (str): Path to CSV file with registration data
            output_file (str): Output report filename
            
        Returns:
            str: Path to the generated report
        """
        try:
            df = pd.read_csv(csv_file)
            
            report = f"""# ExJAM PG Conference Registration Report

Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## Executive Summary
- **Total Registrations**: {len(df)}
- **Registration Period**: {df['created_time'].min()} to {df['created_time'].max()}

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

## Recommendations
Based on the registration data:

1. **Catering**: Plan for {df['Dietary Restrictions (for catering purposes)'].value_counts().get('None', 0)} standard meals and accommodate special dietary requirements
2. **Accommodation**: {df['Do you need accommodation assistance?'].value_counts().get('Yes, I need accommodation', 0)} participants need accommodation assistance
3. **Transportation**: {df['Do you need transportation assistance from the airport?'].value_counts().get('Yes, I need airport pickup', 0)} participants need airport pickup
4. **Sessions**: Focus on the most popular session topics based on participant interests

---
*Report generated automatically from registration data*
"""
            
            with open(output_file, 'w') as f:
                f.write(report)
            
            print(f"Registration report generated: {output_file}")
            return output_file
            
        except Exception as e:
            print(f"Error generating report: {e}")
            return None


def main():
    """Example usage of the registration module."""
    # Initialize the registration module
    registration = ExjamRegistrationModule()
    
    print("=== ExJAM PG Conference Registration Module ===\n")
    
    # Create the registration form
    print("1. Creating Google Form for PG Conference registration...")
    form_id = registration.create_pg_conference_form()
    
    if form_id:
        # Generate QR codes
        print("\n2. Generating QR codes...")
        qr_codes = registration.generate_registration_qr_codes(form_id)
        
        print("\nGenerated QR codes:")
        for qr_type, filepath in qr_codes.items():
            print(f"  - {qr_type}: {filepath}")
        
        # Example of exporting responses (would work with actual form data)
        print("\n3. Registration module ready for use!")
        print(f"Form URL: https://docs.google.com/forms/d/{form_id}/viewform")
        print("\nTo export responses when available:")
        print("registration.export_responses_to_csv()")
        print("\nTo generate reports:")
        print("registration.generate_registration_report('registration_responses.csv')")
    
    print("\n=== Setup Complete ===")


if __name__ == "__main__":
    main()
