from dotenv import load_dotenv
load_dotenv()
import email_utils
import os
print("Email module loaded successfully")
print(f"SES Region: {os.getenv('AWS_SES_REGION')}")
print(f"Sender: {os.getenv('SES_SENDER_EMAIL')}")
