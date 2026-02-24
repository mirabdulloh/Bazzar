import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { MemberService } from './member.service';

@Controller()
export class MemberHttpController {
	constructor(private readonly memberService: MemberService) {}

	// ! Verify email via clickable link
	@Get('verify-email')
	public async verifyEmail(@Query('token') token: string, @Res() res: Response): Promise<void> {
		try {
			await this.memberService.verifyEmail(token);
			res.send(`
        <html><body style="font-family:sans-serif;text-align:center;padding:60px">
          <h2 style="color:#2e7d32">Email verified successfully!</h2>
          <p>You can now log in to Bazaar.</p>
        </body></html>
      `);
		} catch {
			res.status(400).send(`
        <html><body style="font-family:sans-serif;text-align:center;padding:60px">
          <h2 style="color:#c62828">Invalid or expired verification link.</h2>
          <p>Please sign up again or contact support.</p>
        </body></html>
      `);
		}
	}

	// ! Reset password — show form
	@Get('reset-password')
	public resetPasswordPage(@Query('token') token: string, @Res() res: Response): void {
		res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8"/>
        <title>Reset Password — Bazaar</title>
        <style>
          *{box-sizing:border-box;margin:0;padding:0}
          body{font-family:sans-serif;background:#f0f2f5;display:flex;justify-content:center;align-items:center;min-height:100vh}
          .card{background:#fff;border-radius:12px;padding:40px;width:100%;max-width:420px;box-shadow:0 4px 20px rgba(0,0,0,.1)}
          h2{margin-bottom:8px;font-size:22px;color:#111}
          p{color:#666;font-size:14px;margin-bottom:24px}
          label{display:block;font-size:13px;font-weight:600;color:#333;margin-bottom:6px}
          .pw-wrap{position:relative;margin-bottom:4px}
          .pw-wrap input{width:100%;padding:10px 42px 10px 14px;border:1px solid #ddd;border-radius:8px;font-size:15px;outline:none;transition:border .2s}
          .pw-wrap input:focus{border-color:#1a73e8}
          .eye{position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;padding:0;color:#999;display:flex;align-items:center}
          .eye:hover{color:#444}
          .hint{font-size:12px;color:#999;margin-top:4px;margin-bottom:16px}
          .submit-btn{width:100%;padding:12px;background:#1a73e8;color:#fff;border:none;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer;margin-top:8px}
          .submit-btn:hover{background:#1558c0}
          .msg{margin-top:16px;font-size:14px;text-align:center}
          .err{color:#c62828}
          .success-box{text-align:center;padding:16px 0}
          .success-box .check{font-size:52px;margin-bottom:12px}
          .success-box h3{font-size:20px;color:#2e7d32;margin-bottom:8px}
          .success-box p{color:#555;font-size:14px;line-height:1.6}
        </style>
      </head>
      <body>
        <div class="card">
          <div id="form-section">
            <h2>Reset your password</h2>
            <p>Enter a new password for your Bazaar account.</p>
            <form id="f">
              <input type="hidden" id="token" value="${token}"/>
              <label for="pw">New password</label>
              <div class="pw-wrap">
                <input type="password" id="pw" placeholder="Min. 7 characters" required minlength="7"/>
                <button type="button" class="eye" onclick="toggleEye('pw','eye1')">
                  <svg id="eye1" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                  </svg>
                </button>
              </div>
              <div class="hint">At least 7 characters</div>
              <label for="pw2">Confirm password</label>
              <div class="pw-wrap">
                <input type="password" id="pw2" placeholder="Repeat new password" required/>
                <button type="button" class="eye" onclick="toggleEye('pw2','eye2')">
                  <svg id="eye2" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                  </svg>
                </button>
              </div>
              <button class="submit-btn" type="submit">Set new password</button>
              <div class="msg err" id="msg"></div>
            </form>
          </div>
          <div id="success-section" style="display:none">
            <div class="success-box">
              <div class="check">✅</div>
              <h3>Password reset successfully!</h3>
              <p>Your password has been updated.<br/>You can close this window and log in with your new password.</p>
            </div>
          </div>
        </div>
        <script>
          function toggleEye(inputId, svgId) {
            var input = document.getElementById(inputId);
            var isHidden = input.type === 'password';
            input.type = isHidden ? 'text' : 'password';
            var svg = document.getElementById(svgId);
            svg.innerHTML = isHidden
              ? '<path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>'
              : '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
          }
          document.getElementById('f').addEventListener('submit', async function(e) {
            e.preventDefault();
            const pw  = document.getElementById('pw').value;
            const pw2 = document.getElementById('pw2').value;
            const msg = document.getElementById('msg');
            msg.textContent = '';
            if (pw !== pw2) { msg.textContent = 'Passwords do not match.'; return; }
            try {
              const r = await fetch('/graphql', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: \`mutation { resetPassword(token: "\${document.getElementById('token').value}", newPassword: "\${pw}") }\` })
              });
              const json = await r.json();
              if (json.errors) {
                msg.textContent = json.errors[0].message;
              } else {
                document.getElementById('form-section').style.display = 'none';
                document.getElementById('success-section').style.display = 'block';
              }
            } catch { msg.textContent = 'Something went wrong. Please try again.'; }
          });
        </script>
      </body>
      </html>
    `);
	}
}
