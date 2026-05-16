"""
watsonx.ai Configuration Module

This module provides configuration settings for IBM watsonx.ai API integration.
All sensitive credentials should be loaded from environment variables.
"""

import os
from typing import Dict, Any
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class WatsonxConfig:
    """Configuration class for watsonx.ai API settings."""
    
    def __init__(self):
        """Initialize configuration from environment variables."""
        self.api_key = os.getenv('WATSONX_API_KEY')
        self.project_id = os.getenv('WATSONX_PROJECT_ID')
        self.url = 'https://us-south.ml.cloud.ibm.com'
        self.model_id = os.getenv('WATSONX_MODEL_ID', 'openai/gpt-oss-120b')
        
        # Model parameters - read from env or use defaults
        self.parameters = {
            'max_new_tokens': int(os.getenv('WATSONX_MAX_TOKENS', '100000')),
            'temperature': float(os.getenv('WATSONX_TEMPERATURE', '0.2')),
            'top_p': float(os.getenv('WATSONX_TOP_P', '0.9')),
            'decoding_method': 'greedy',
            'repetition_penalty': 1.0
        }
    
    def validate(self) -> tuple[bool, str]:
        """
        Validate that all required configuration is present.
        
        Returns:
            tuple: (is_valid, error_message)
        """
        if not self.api_key:
            return False, "WATSONX_API_KEY environment variable is not set"
        
        if not self.project_id:
            return False, "WATSONX_PROJECT_ID environment variable is not set"
        
        return True, ""
    
    def get_credentials(self) -> Dict[str, Any]:
        """
        Get credentials dictionary for watsonx.ai API.
        
        Returns:
            dict: Credentials containing API key and URL
        """
        return {
            'url': self.url,
            'apikey': self.api_key
        }
    
    def get_model_params(self) -> Dict[str, Any]:
        """
        Get model parameters for text generation.
        
        Returns:
            dict: Model parameters
        """
        return self.parameters.copy()
    
    def __repr__(self) -> str:
        """String representation of config (without exposing credentials)."""
        return (
            f"WatsonxConfig(url={self.url}, "
            f"model_id={self.model_id}, "
            f"api_key={'***' if self.api_key else 'NOT SET'}, "
            f"project_id={'***' if self.project_id else 'NOT SET'})"
        )


# Global configuration instance
config = WatsonxConfig()

# Made with Bob
