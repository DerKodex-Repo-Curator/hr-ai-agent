import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

def send_mission_email(to_email: str, subject: str, html_content: str):
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASSWORD")
    sender_name = os.getenv("SMTP_SENDER_NAME", "Space42 Mission Control")

    if not smtp_user or not smtp_pass:
        print("❌ Telemetry Error: SMTP credentials missing from environment.")
        return False

    msg = MIMEMultipart()
    msg['From'] = f"{sender_name} <{smtp_user}>"
    msg['To'] = to_email
    msg['Subject'] = subject

    msg.attach(MIMEText(html_content, 'html'))

    try:
        # Port 465 is for SSL; if your server uses TLS, use 587 and starttls()
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(smtp_user, smtp_pass)
            server.sendmail(smtp_user, to_email, msg.as_string())
        print(f"✅ Mission Update Dispatched to: {to_email}")
        return True
    except Exception as e:
        print(f"❌ Communications Failure: {e}")
        return False