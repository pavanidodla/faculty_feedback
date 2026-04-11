const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ── OTP Email ────────────────────────────────────────────────────────────────
exports.sendOTPEmail = async (to, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || `RGUKT FFS <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Password Reset OTP - RGUKT Faculty Feedback System',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #f0f4ff; padding: 2rem; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 1.5rem;">
          <div style="font-size: 2.5rem;">🎓</div>
          <h2 style="color: #1a56db; margin: 0.5rem 0 0;">RGUKT Faculty Feedback System</h2>
        </div>
        <div style="background: white; border-radius: 10px; padding: 1.75rem; box-shadow: 0 4px 20px rgba(26,86,219,0.08);">
          <h3 style="margin: 0 0 1rem; color: #111827;">Password Reset Request</h3>
          <p style="color: #6b7280; margin: 0 0 1.25rem; line-height: 1.6;">
            We received a request to reset your password. Use the OTP below. It is valid for <strong>10 minutes</strong>.
          </p>
          <div style="background: #f0f4ff; border: 2px dashed #1a56db; border-radius: 10px; padding: 1.25rem; text-align: center; margin-bottom: 1.25rem;">
            <div style="font-size: 0.8rem; color: #6b7280; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 0.4rem;">Your OTP</div>
            <div style="font-size: 2.5rem; font-weight: 800; letter-spacing: 0.25em; color: #1a56db; font-family: 'Courier New', monospace;">${otp}</div>
          </div>
          <p style="color: #9ca3af; font-size: 0.82rem; margin: 0; line-height: 1.5;">
            If you did not request this, please ignore this email. Your account is safe.<br/>
            Do not share this OTP with anyone.
          </p>
        </div>
        <p style="text-align: center; color: #9ca3af; font-size: 0.78rem; margin-top: 1rem;">
          © RGUKT Faculty Feedback System
        </p>
      </div>
    `,
  };
  await transporter.sendMail(mailOptions);
};

// ── Feedback Confirmation Email ───────────────────────────────────────────────
// entries: [{ subjectName, faculty, ratings: [1-5, ...], averageRating, improvement }]
exports.sendFeedbackConfirmationEmail = async ({ to, studentName, rollNo, year, semester, branch, campus, entries, submittedAt }) => {

  const QUESTIONS = [
    'Concept Explanation',
    'Subject Knowledge',
    'Interactivity',
    'Doubt Clearing',
    'Punctuality',
  ];

  const starBar = (rating) => {
    const filled = '★'.repeat(rating);
    const empty  = '☆'.repeat(5 - rating);
    return `<span style="color:#f59e0b;font-size:1.1rem;">${filled}</span><span style="color:#d1d5db;font-size:1.1rem;">${empty}</span>`;
  };

  const classifyRating = (avg) => {
    if (avg >= 4.5) return { label: 'Excellent', color: '#065f46', bg: '#d1fae5' };
    if (avg >= 3.5) return { label: 'Good',      color: '#1e40af', bg: '#dbeafe' };
    if (avg >= 2.5) return { label: 'Average',   color: '#92400e', bg: '#fef3c7' };
    return           { label: 'Poor',      color: '#991b1b', bg: '#fee2e2' };
  };

  // Build one card per subject
  const subjectCards = entries.map((entry, idx) => {
    const avg = entry.averageRating ? entry.averageRating.toFixed(1) : 'N/A';
    const cl  = classifyRating(Number(avg));

    const ratingRows = QUESTIONS.map((q, qi) => `
      <tr>
        <td style="padding:6px 10px;font-size:0.82rem;color:#374151;border-bottom:1px solid #f3f4f6;">${q}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #f3f4f6;white-space:nowrap;">${starBar(entry.ratings[qi] || 0)}</td>
        <td style="padding:6px 10px;font-size:0.82rem;font-weight:700;color:#1a56db;border-bottom:1px solid #f3f4f6;text-align:center;">${entry.ratings[qi] || 0}/5</td>
      </tr>
    `).join('');

    return `
      <div style="background:white;border-radius:10px;border:1px solid #e5e7eb;margin-bottom:1.25rem;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.05);">
        <!-- Card Header -->
        <div style="background:linear-gradient(135deg,#1a56db 0%,#0f172a 100%);padding:1rem 1.25rem;display:flex;justify-content:space-between;align-items:center;">
          <div>
            <div style="font-size:0.72rem;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:2px;">Subject ${idx + 1}</div>
            <div style="font-size:1rem;font-weight:700;color:white;">${entry.subjectName}</div>
            <div style="font-size:0.82rem;color:rgba(255,255,255,0.75);margin-top:2px;">👨‍🏫 ${entry.faculty}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:1.6rem;font-weight:800;color:white;line-height:1;">${avg}</div>
            <div style="font-size:0.72rem;color:rgba(255,255,255,0.6);">out of 5</div>
            <div style="display:inline-block;background:${cl.bg};color:${cl.color};padding:2px 8px;border-radius:12px;font-size:0.72rem;font-weight:700;margin-top:4px;">${cl.label}</div>
          </div>
        </div>
        <!-- Ratings Table -->
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:#f8faff;">
              <th style="padding:8px 10px;text-align:left;font-size:0.72rem;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Criterion</th>
              <th style="padding:8px 10px;text-align:left;font-size:0.72rem;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Rating</th>
              <th style="padding:8px 10px;text-align:center;font-size:0.72rem;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Score</th>
            </tr>
          </thead>
          <tbody>${ratingRows}</tbody>
        </table>
        <!-- Improvement -->
        <div style="padding:0.875rem 1.25rem;background:#f9fafb;border-top:1px solid #e5e7eb;">
          <div style="font-size:0.72rem;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">Your Improvement Suggestion</div>
          <div style="font-size:0.875rem;color:#374151;line-height:1.6;font-style:italic;">"${entry.improvement}"</div>
        </div>
      </div>
    `;
  }).join('');

  const overallAvg = entries.length > 0
    ? (entries.reduce((sum, e) => sum + (e.averageRating || 0), 0) / entries.length).toFixed(2)
    : 'N/A';

  const date = submittedAt
    ? new Date(submittedAt).toLocaleString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : new Date().toLocaleString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="margin:0;padding:0;background:#f0f4ff;font-family:'Segoe UI',Arial,sans-serif;">
      <div style="max-width:600px;margin:0 auto;padding:1.5rem;">

        <!-- Header -->
        <div style="text-align:center;padding:1.5rem 0 1rem;">
          <div style="font-size:2.5rem;margin-bottom:0.5rem;">🎓</div>
          <h1 style="margin:0;font-size:1.4rem;color:#1a56db;font-weight:800;">RGUKT Faculty Feedback System</h1>
          <p style="margin:0.25rem 0 0;color:#6b7280;font-size:0.875rem;">Feedback Submission Confirmation</p>
        </div>

        <!-- Success Banner -->
        <div style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);border-radius:12px;padding:1.5rem;text-align:center;margin-bottom:1.5rem;">
          <div style="font-size:2.5rem;margin-bottom:0.5rem;">✅</div>
          <h2 style="margin:0;color:white;font-size:1.3rem;">Feedback Submitted Successfully!</h2>
          <p style="margin:0.5rem 0 0;color:rgba(255,255,255,0.85);font-size:0.9rem;">
            Thank you, <strong>${studentName}</strong>! Your feedback has been recorded.
          </p>
        </div>

        <!-- Submission Details -->
        <div style="background:white;border-radius:10px;padding:1.25rem;margin-bottom:1.25rem;border:1px solid #e5e7eb;box-shadow:0 2px 8px rgba(0,0,0,0.04);">
          <h3 style="margin:0 0 1rem;color:#111827;font-size:1rem;font-weight:700;border-bottom:1px solid #f3f4f6;padding-bottom:0.6rem;">
            📋 Submission Details
          </h3>
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:5px 0;font-size:0.82rem;color:#6b7280;width:40%;">Roll Number</td>
              <td style="padding:5px 0;font-size:0.875rem;font-weight:600;color:#111827;">${rollNo.toUpperCase()}</td>
            </tr>
            <tr>
              <td style="padding:5px 0;font-size:0.82rem;color:#6b7280;">Year / Semester</td>
              <td style="padding:5px 0;font-size:0.875rem;font-weight:600;color:#111827;">${year} / ${semester}</td>
            </tr>
            <tr>
              <td style="padding:5px 0;font-size:0.82rem;color:#6b7280;">Branch</td>
              <td style="padding:5px 0;font-size:0.875rem;font-weight:600;color:#111827;">${branch}</td>
            </tr>
            <tr>
              <td style="padding:5px 0;font-size:0.82rem;color:#6b7280;">Campus</td>
              <td style="padding:5px 0;font-size:0.875rem;font-weight:600;color:#111827;">${campus}</td>
            </tr>
            <tr>
              <td style="padding:5px 0;font-size:0.82rem;color:#6b7280;">Subjects Rated</td>
              <td style="padding:5px 0;font-size:0.875rem;font-weight:600;color:#111827;">${entries.length} subject${entries.length !== 1 ? 's' : ''}</td>
            </tr>
            <tr>
              <td style="padding:5px 0;font-size:0.82rem;color:#6b7280;">Overall Average</td>
              <td style="padding:5px 0;font-size:0.875rem;font-weight:700;color:#1a56db;">${overallAvg} / 5</td>
            </tr>
            <tr>
              <td style="padding:5px 0;font-size:0.82rem;color:#6b7280;">Submitted At</td>
              <td style="padding:5px 0;font-size:0.875rem;font-weight:600;color:#111827;">${date}</td>
            </tr>
          </table>
        </div>

        <!-- Subject-wise Feedback -->
        <h3 style="margin:0 0 0.875rem;color:#111827;font-size:1rem;font-weight:700;">📚 Your Feedback Summary</h3>
        ${subjectCards}

        <!-- Note -->
        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:1rem 1.25rem;margin-bottom:1.25rem;">
          <div style="display:flex;align-items:flex-start;gap:0.6rem;">
            <span style="font-size:1.1rem;">💡</span>
            <div>
              <div style="font-weight:700;color:#92400e;font-size:0.875rem;margin-bottom:0.25rem;">Your feedback is confidential</div>
              <div style="color:#78350f;font-size:0.82rem;line-height:1.6;">
                Your identity is kept private. This feedback is used by the administration to improve teaching quality at RGUKT. 
                You cannot re-submit feedback for this combination (${year}/${semester}/${branch}/${campus}).
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div style="text-align:center;padding:1rem 0;">
          <p style="margin:0;color:#9ca3af;font-size:0.78rem;">
            This is an automated confirmation email.<br/>
            © RGUKT Faculty Feedback System
          </p>
        </div>

      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || `RGUKT FFS <${process.env.EMAIL_USER}>`,
    to,
    subject: `✅ Feedback Submitted Successfully – ${year} ${semester} ${branch} | RGUKT FFS`,
    html,
  });
};