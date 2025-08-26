#!/usr/bin/env python3
"""
Exjam Alumni Data Analysis Tool

This script provides functions for analyzing alumni survey data and generating insights.
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime
import json
import os

class AlumniAnalyzer:
    def __init__(self, data_file=None):
        """
        Initialize the AlumniAnalyzer with optional data file.
        
        Args:
            data_file (str): Path to CSV file containing alumni data
        """
        self.data = None
        self.analysis_results = {}
        
        if data_file and os.path.exists(data_file):
            self.load_data(data_file)
    
    def load_data(self, file_path):
        """
        Load alumni data from CSV file.
        
        Args:
            file_path (str): Path to the CSV file
        """
        try:
            self.data = pd.read_csv(file_path)
            print(f"Data loaded successfully: {len(self.data)} records")
        except Exception as e:
            print(f"Error loading data: {e}")
    
    def basic_statistics(self):
        """
        Generate basic statistics about the alumni data.
        
        Returns:
            dict: Dictionary containing basic statistics
        """
        if self.data is None:
            print("No data loaded. Please load data first.")
            return {}
        
        stats = {
            'total_alumni': len(self.data),
            'graduation_years': self.data['graduation_year'].value_counts().to_dict(),
            'programs': self.data['program'].value_counts().to_dict(),
            'industries': self.data['industry'].value_counts().to_dict(),
            'locations': self.data['location'].value_counts().head(10).to_dict()
        }
        
        self.analysis_results['basic_stats'] = stats
        return stats
    
    def career_analysis(self):
        """
        Analyze career trajectories and patterns.
        
        Returns:
            dict: Career analysis results
        """
        if self.data is None:
            print("No data loaded. Please load data first.")
            return {}
        
        career_stats = {
            'avg_jobs_since_graduation': self.data['jobs_since_graduation'].mean(),
            'employment_types': self.data['employment_type'].value_counts().to_dict(),
            'years_in_current_role': self.data['years_in_current_role'].value_counts().to_dict(),
            'leadership_positions': self.data['has_leadership'].value_counts().to_dict()
        }
        
        self.analysis_results['career_analysis'] = career_stats
        return career_stats
    
    def education_impact_analysis(self):
        """
        Analyze the impact of Exjam education on careers.
        
        Returns:
            dict: Education impact analysis results
        """
        if self.data is None:
            print("No data loaded. Please load data first.")
            return {}
        
        # Calculate average ratings for different impact areas
        impact_columns = [
            'technical_skills_impact',
            'problem_solving_impact', 
            'networking_impact',
            'industry_knowledge_impact',
            'confidence_impact'
        ]
        
        impact_analysis = {}
        for col in impact_columns:
            if col in self.data.columns:
                impact_analysis[col] = {
                    'mean': self.data[col].mean(),
                    'median': self.data[col].median(),
                    'std': self.data[col].std()
                }
        
        self.analysis_results['education_impact'] = impact_analysis
        return impact_analysis
    
    def network_analysis(self):
        """
        Analyze alumni network connectivity and engagement.
        
        Returns:
            dict: Network analysis results
        """
        if self.data is None:
            print("No data loaded. Please load data first.")
            return {}
        
        network_stats = {
            'connection_levels': self.data['connection_level'].value_counts().to_dict(),
            'mentorship_interest': self.data['mentorship_interest'].value_counts().to_dict(),
            'recommendation_rate': self.data['would_recommend'].value_counts().to_dict()
        }
        
        self.analysis_results['network_analysis'] = network_stats
        return network_stats
    
    def generate_visualizations(self, output_dir='./output'):
        """
        Generate visualizations for the analysis results.
        
        Args:
            output_dir (str): Directory to save visualization files
        """
        if self.data is None:
            print("No data loaded. Please load data first.")
            return
        
        # Create output directory if it doesn't exist
        os.makedirs(output_dir, exist_ok=True)
        
        # Set style for better-looking plots
        plt.style.use('seaborn-v0_8')
        
        # 1. Graduation Year Distribution
        plt.figure(figsize=(12, 6))
        self.data['graduation_year'].value_counts().sort_index().plot(kind='bar')
        plt.title('Alumni Distribution by Graduation Year')
        plt.xlabel('Graduation Year')
        plt.ylabel('Number of Alumni')
        plt.xticks(rotation=45)
        plt.tight_layout()
        plt.savefig(f'{output_dir}/graduation_year_distribution.png', dpi=300, bbox_inches='tight')
        plt.close()
        
        # 2. Industry Distribution
        plt.figure(figsize=(12, 8))
        industry_counts = self.data['industry'].value_counts().head(10)
        industry_counts.plot(kind='barh')
        plt.title('Top 10 Industries for Exjam Alumni')
        plt.xlabel('Number of Alumni')
        plt.tight_layout()
        plt.savefig(f'{output_dir}/industry_distribution.png', dpi=300, bbox_inches='tight')
        plt.close()
        
        # 3. Education Impact Ratings
        impact_columns = [
            'technical_skills_impact',
            'problem_solving_impact', 
            'networking_impact',
            'industry_knowledge_impact',
            'confidence_impact'
        ]
        
        available_columns = [col for col in impact_columns if col in self.data.columns]
        
        if available_columns:
            plt.figure(figsize=(10, 6))
            impact_means = [self.data[col].mean() for col in available_columns]
            impact_labels = [col.replace('_impact', '').replace('_', ' ').title() for col in available_columns]
            
            plt.bar(impact_labels, impact_means)
            plt.title('Average Impact of Exjam Education (1-5 Scale)')
            plt.ylabel('Average Rating')
            plt.ylim(0, 5)
            plt.xticks(rotation=45)
            plt.tight_layout()
            plt.savefig(f'{output_dir}/education_impact_ratings.png', dpi=300, bbox_inches='tight')
            plt.close()
        
        # 4. Connection Levels
        plt.figure(figsize=(8, 6))
        self.data['connection_level'].value_counts().plot(kind='pie', autopct='%1.1f%%')
        plt.title('Alumni Network Connection Levels')
        plt.ylabel('')
        plt.tight_layout()
        plt.savefig(f'{output_dir}/connection_levels.png', dpi=300, bbox_inches='tight')
        plt.close()
        
        print(f"Visualizations saved to {output_dir}/")
    
    def generate_report(self, output_file='alumni_analysis_report.md'):
        """
        Generate a comprehensive analysis report.
        
        Args:
            output_file (str): Path to save the report
        """
        report = f"""# Exjam Alumni Analysis Report

Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## Executive Summary
This report presents the findings from the Exjam alumni research study.

## Basic Statistics
- **Total Alumni Surveyed**: {self.analysis_results.get('basic_stats', {}).get('total_alumni', 'N/A')}

### Graduation Year Distribution
{self._format_dict_to_md(self.analysis_results.get('basic_stats', {}).get('graduation_years', {}))}

### Program Distribution
{self._format_dict_to_md(self.analysis_results.get('basic_stats', {}).get('programs', {}))}

### Top Industries
{self._format_dict_to_md(self.analysis_results.get('basic_stats', {}).get('industries', {}))}

## Career Analysis
### Employment Types
{self._format_dict_to_md(self.analysis_results.get('career_analysis', {}).get('employment_types', {}))}

### Leadership Positions
{self._format_dict_to_md(self.analysis_results.get('career_analysis', {}).get('leadership_positions', {}))}

## Education Impact Analysis
{self._format_impact_analysis(self.analysis_results.get('education_impact', {}))}

## Network Analysis
### Connection Levels
{self._format_dict_to_md(self.analysis_results.get('network_analysis', {}).get('connection_levels', {}))}

### Mentorship Interest
{self._format_dict_to_md(self.analysis_results.get('network_analysis', {}).get('mentorship_interest', {}))}

## Recommendations
Based on the analysis, the following recommendations are made:

1. **Strengthen Alumni Network**: Focus on improving connection levels among alumni
2. **Enhance Technical Skills**: Continue emphasizing technical skill development
3. **Expand Mentorship Programs**: Leverage alumni interest in mentoring
4. **Industry Partnerships**: Build stronger connections with top industries

---
*Report generated by AlumniAnalyzer*
"""
        
        with open(output_file, 'w') as f:
            f.write(report)
        
        print(f"Report saved to {output_file}")
    
    def _format_dict_to_md(self, data_dict):
        """Helper method to format dictionary as markdown table."""
        if not data_dict:
            return "No data available"
        
        md = "| Category | Count |\n|----------|-------|\n"
        for key, value in data_dict.items():
            md += f"| {key} | {value} |\n"
        return md
    
    def _format_impact_analysis(self, impact_data):
        """Helper method to format impact analysis as markdown table."""
        if not impact_data:
            return "No impact data available"
        
        md = "| Impact Area | Mean Rating | Median | Std Dev |\n|-------------|-------------|--------|---------|\n"
        for area, stats in impact_data.items():
            area_name = area.replace('_impact', '').replace('_', ' ').title()
            md += f"| {area_name} | {stats['mean']:.2f} | {stats['median']:.2f} | {stats['std']:.2f} |\n"
        return md
    
    def save_results(self, output_file='analysis_results.json'):
        """
        Save analysis results to JSON file.
        
        Args:
            output_file (str): Path to save the results
        """
        with open(output_file, 'w') as f:
            json.dump(self.analysis_results, f, indent=2, default=str)
        
        print(f"Analysis results saved to {output_file}")


def main():
    """Example usage of the AlumniAnalyzer."""
    # Initialize analyzer
    analyzer = AlumniAnalyzer()
    
    # Example: Create sample data for demonstration
    sample_data = {
        'graduation_year': [2020, 2021, 2022, 2023, 2020, 2021],
        'program': ['Computer Science', 'Data Science', 'Computer Science', 'Data Science', 'Computer Science', 'Data Science'],
        'industry': ['Technology', 'Finance', 'Technology', 'Healthcare', 'Technology', 'Finance'],
        'location': ['New York', 'San Francisco', 'London', 'Toronto', 'Berlin', 'Singapore'],
        'employment_type': ['Full-time', 'Full-time', 'Full-time', 'Full-time', 'Freelance', 'Full-time'],
        'jobs_since_graduation': [2, 1, 3, 1, 4, 2],
        'years_in_current_role': [2, 1, 1, 1, 3, 1],
        'has_leadership': [True, False, True, False, True, False],
        'technical_skills_impact': [4, 5, 4, 3, 5, 4],
        'problem_solving_impact': [4, 4, 5, 4, 4, 5],
        'networking_impact': [3, 4, 3, 2, 4, 3],
        'industry_knowledge_impact': [4, 4, 3, 4, 3, 4],
        'confidence_impact': [4, 5, 4, 3, 4, 4],
        'connection_level': ['Somewhat connected', 'Very connected', 'Minimally connected', 'Not connected', 'Very connected', 'Somewhat connected'],
        'mentorship_interest': ['Yes, definitely', 'Maybe', 'Yes, definitely', 'No', 'Maybe', 'Yes, definitely'],
        'would_recommend': ['Yes, definitely', 'Yes, definitely', 'Yes, with reservations', 'Yes, definitely', 'Yes, definitely', 'Yes, definitely']
    }
    
    analyzer.data = pd.DataFrame(sample_data)
    
    # Run analyses
    print("Running basic statistics...")
    analyzer.basic_statistics()
    
    print("Running career analysis...")
    analyzer.career_analysis()
    
    print("Running education impact analysis...")
    analyzer.education_impact_analysis()
    
    print("Running network analysis...")
    analyzer.network_analysis()
    
    # Generate visualizations
    print("Generating visualizations...")
    analyzer.generate_visualizations()
    
    # Generate report
    print("Generating report...")
    analyzer.generate_report()
    
    # Save results
    analyzer.save_results()
    
    print("Analysis complete!")


if __name__ == "__main__":
    main()
