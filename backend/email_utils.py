"""
AWS SES를 이용한 이메일 발송 유틸리티
"""
import boto3
from botocore.exceptions import ClientError
import os

def get_ses_client():
    """SES 클라이언트를 생성합니다."""
    return boto3.client(
        "ses",
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
        region_name=os.getenv("AWS_SES_REGION", "us-east-1"),
    )


def send_verification_email(recipient_email: str, token: str):
    """
    회원가입 시 이메일 인증 링크를 발송합니다.
    
    Args:
        recipient_email: 수신자 이메일 주소
        token: 인증용 UUID 토큰
    """
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    verification_link = f"{frontend_url}/verify-email?token={token}"
    sender_email = os.getenv("SES_SENDER_EMAIL")

    subject = "[부름] 회원가입 이메일 인증을 완료해주세요"

    body_html = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {{ font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; }}
        .container {{ max-width: 520px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }}
        .header {{ background: linear-gradient(135deg, #FF7E36, #FF5722); padding: 36px 32px; text-align: center; }}
        .header h1 {{ color: #ffffff; font-size: 26px; margin: 0; font-weight: 800; }}
        .header p {{ color: rgba(255,255,255,0.9); font-size: 14px; margin-top: 8px; }}
        .body {{ padding: 36px 32px; }}
        .body p {{ color: #4D5159; font-size: 15px; line-height: 1.7; margin: 0 0 16px; }}
        .btn-container {{ text-align: center; margin: 28px 0; }}
        .btn {{ display: inline-block; background: linear-gradient(135deg, #FF7E36, #FF5722); color: #ffffff !important; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-size: 16px; font-weight: 700; }}
        .footer {{ padding: 20px 32px; background: #f9f9f9; border-top: 1px solid #eee; text-align: center; }}
        .footer p {{ color: #999; font-size: 12px; margin: 0; }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>부름(Buleum)</h1>
          <p>이메일 인증 안내</p>
        </div>
        <div class="body">
          <p>안녕하세요! 부름(Buleum) 서비스에 가입해주셔서 감사합니다.</p>
          <p>아래 버튼을 클릭하여 이메일 인증을 완료하고, 부름 서비스를 이용해 보세요.</p>
          <div class="btn-container">
            <a class="btn" href="{verification_link}">이메일 인증 완료하기</a>
          </div>
          <p>만약 본인이 가입을 요청하지 않으셨다면 이 메일을 무시하셔도 됩니다.</p>
          <p style="color: #999; font-size: 13px;">본 링크는 발급 후 24시간 동안 유효합니다.</p>
        </div>
        <div class="footer">
          <p>&copy; 2024 부름(Buleum). All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    """

    body_text = f"부름(Buleum) 이메일 인증 링크: {verification_link}"

    try:
        ses_client = get_ses_client()
        response = ses_client.send_email(
            Source=sender_email,
            Destination={"ToAddresses": [recipient_email]},
            Message={
                "Subject": {"Data": subject, "Charset": "UTF-8"},
                "Body": {
                    "Html": {"Data": body_html, "Charset": "UTF-8"},
                    "Text": {"Data": body_text, "Charset": "UTF-8"},
                },
            },
        )
        print(f"[SES] Verification email sent to {recipient_email}, MessageId: {response['MessageId']}")
        return response
    except ClientError as e:
        print(f"[SES ERROR] Failed to send email to {recipient_email}: {e.response['Error']['Message']}")
        raise e


def send_verification_code_email(recipient_email: str, code: str):
    """
    회원가입 시 6자리 인증번호를 이메일로 발송합니다.
    
    Args:
        recipient_email: 수신자 이메일 주소
        code: 6자리 인증 코드
    """
    sender_email = os.getenv("SES_SENDER_EMAIL")

    subject = "[부름] 이메일 인증번호 안내"

    body_html = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {{ font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; }}
        .container {{ max-width: 520px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }}
        .header {{ background: linear-gradient(135deg, #FF7E36, #FF5722); padding: 36px 32px; text-align: center; }}
        .header h1 {{ color: #ffffff; font-size: 26px; margin: 0; font-weight: 800; }}
        .header p {{ color: rgba(255,255,255,0.9); font-size: 14px; margin-top: 8px; }}
        .body {{ padding: 36px 32px; text-align: center; }}
        .body p {{ color: #4D5159; font-size: 15px; line-height: 1.7; margin: 0 0 16px; }}
        .code-box {{ background: linear-gradient(135deg, #FFF3E0, #FFF8E1); border: 2px dashed #FF7E36; border-radius: 12px; padding: 24px; margin: 24px 0; }}
        .code-number {{ font-size: 42px; font-weight: 900; color: #FF5722; letter-spacing: 12px; font-family: 'Courier New', monospace; }}
        .expire-notice {{ background: #F5F5F5; border-radius: 8px; padding: 12px; margin-top: 20px; }}
        .expire-notice p {{ color: #999; font-size: 13px; margin: 0; }}
        .footer {{ padding: 20px 32px; background: #f9f9f9; border-top: 1px solid #eee; text-align: center; }}
        .footer p {{ color: #999; font-size: 12px; margin: 0; }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>부름(Buleum)</h1>
          <p>이메일 인증번호 안내</p>
        </div>
        <div class="body">
          <p>안녕하세요! 부름(Buleum) 서비스에 가입해주셔서 감사합니다.</p>
          <p>아래 인증번호를 회원가입 화면에 입력해주세요.</p>
          <div class="code-box">
            <div class="code-number">{code}</div>
          </div>
          <div class="expire-notice">
            <p>⏰ 본 인증번호는 <strong>5분간</strong> 유효합니다.</p>
          </div>
          <p style="margin-top: 20px;">만약 본인이 가입을 요청하지 않으셨다면 이 메일을 무시하셔도 됩니다.</p>
        </div>
        <div class="footer">
          <p>&copy; 2024 부름(Buleum). All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    """

    body_text = f"부름(Buleum) 이메일 인증번호: {code} (5분간 유효)"

    try:
        ses_client = get_ses_client()
        response = ses_client.send_email(
            Source=sender_email,
            Destination={"ToAddresses": [recipient_email]},
            Message={
                "Subject": {"Data": subject, "Charset": "UTF-8"},
                "Body": {
                    "Html": {"Data": body_html, "Charset": "UTF-8"},
                    "Text": {"Data": body_text, "Charset": "UTF-8"},
                },
            },
        )
        print(f"[SES] Verification code email sent to {recipient_email}, MessageId: {response['MessageId']}")
        return response
    except ClientError as e:
        print(f"[SES ERROR] Failed to send code email to {recipient_email}: {e.response['Error']['Message']}")
        raise e


def send_password_reset_code_email(recipient_email: str, code: str):
    """
    비밀번호 재설정 시 6자리 인증번호를 이메일로 발송합니다.
    
    Args:
        recipient_email: 수신자 이메일 주소
        code: 6자리 인증 코드
    """
    sender_email = os.getenv("SES_SENDER_EMAIL")

    subject = "[부름] 비밀번호 재설정 인증번호 안내"

    body_html = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {{ font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; }}
        .container {{ max-width: 520px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }}
        .header {{ background: linear-gradient(135deg, #2563EB, #1D4ED8); padding: 36px 32px; text-align: center; }}
        .header h1 {{ color: #ffffff; font-size: 26px; margin: 0; font-weight: 800; }}
        .header p {{ color: rgba(255,255,255,0.9); font-size: 14px; margin-top: 8px; }}
        .body {{ padding: 36px 32px; text-align: center; }}
        .body p {{ color: #4D5159; font-size: 15px; line-height: 1.7; margin: 0 0 16px; }}
        .code-box {{ background: linear-gradient(135deg, #EFF6FF, #DBEAFE); border: 2px dashed #2563EB; border-radius: 12px; padding: 24px; margin: 24px 0; }}
        .code-number {{ font-size: 42px; font-weight: 900; color: #1D4ED8; letter-spacing: 12px; font-family: 'Courier New', monospace; }}
        .expire-notice {{ background: #F5F5F5; border-radius: 8px; padding: 12px; margin-top: 20px; }}
        .expire-notice p {{ color: #999; font-size: 13px; margin: 0; }}
        .footer {{ padding: 20px 32px; background: #f9f9f9; border-top: 1px solid #eee; text-align: center; }}
        .footer p {{ color: #999; font-size: 12px; margin: 0; }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>부름(Buleum)</h1>
          <p>비밀번호 재설정 안내</p>
        </div>
        <div class="body">
          <p>비밀번호 재설정을 요청하셨습니다.</p>
          <p>아래 인증번호를 비밀번호 재설정 화면에 입력해주세요.</p>
          <div class="code-box">
            <div class="code-number">{code}</div>
          </div>
          <div class="expire-notice">
            <p>⏰ 본 인증번호는 <strong>5분간</strong> 유효합니다.</p>
          </div>
          <p style="margin-top: 20px;">만약 본인이 비밀번호 재설정을 요청하지 않으셨다면 이 메일을 무시하셔도 됩니다.</p>
        </div>
        <div class="footer">
          <p>&copy; 2024 부름(Buleum). All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    """

    body_text = f"부름(Buleum) 비밀번호 재설정 인증번호: {code} (5분간 유효)"

    try:
        ses_client = get_ses_client()
        response = ses_client.send_email(
            Source=sender_email,
            Destination={"ToAddresses": [recipient_email]},
            Message={
                "Subject": {"Data": subject, "Charset": "UTF-8"},
                "Body": {
                    "Html": {"Data": body_html, "Charset": "UTF-8"},
                    "Text": {"Data": body_text, "Charset": "UTF-8"},
                },
            },
        )
        print(f"[SES] Password reset code email sent to {recipient_email}, MessageId: {response['MessageId']}")
        return response
    except ClientError as e:
        print(f"[SES ERROR] Failed to send password reset code to {recipient_email}: {e.response['Error']['Message']}")
        raise e
