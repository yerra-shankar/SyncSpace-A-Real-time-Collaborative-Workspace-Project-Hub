// /src/utils/emailUtils.js

const nodemailer = require('nodemailer');

/**
 * Create email transporter
 */
const createTransporter = () => {
  // Configure based on environment
  if (process.env.NODE_ENV === 'production') {
    // Production: Use actual email service (e.g., SendGrid, AWS SES, etc.)
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  } else {
    // Development: Use Ethereal for testing
    // Note: In development, you should create an Ethereal account at https://ethereal.email/
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
      port: process.env.EMAIL_PORT || 587,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }
};

/**
 * Send email
 */
const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `${process.env.EMAIL_FROM_NAME || 'SyncSpace'} <${process.env.EMAIL_FROM || 'noreply@syncspace.com'}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('Email sent:', info.messageId);

    // For development with Ethereal
    if (process.env.NODE_ENV !== 'production') {
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    }

    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
};

/**
 * Send verification email
 */
const sendVerificationEmail = async (user, verificationToken) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #4F46E5;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .content {
          background-color: #f9f9f9;
          padding: 30px;
          border-radius: 0 0 5px 5px;
        }
        .button {
          display: inline-block;
          padding: 12px 30px;
          background-color: #4F46E5;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          color: #666;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to SyncSpace!</h1>
        </div>
        <div class="content">
          <p>Hi ${user.name},</p>
          <p>Thank you for registering with SyncSpace. Please verify your email address by clicking the button below:</p>
          <div style="text-align: center;">
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #4F46E5;">${verificationUrl}</p>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't create an account with SyncSpace, please ignore this email.</p>
          <p>Best regards,<br>The SyncSpace Team</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} SyncSpace. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: user.email,
    subject: 'Verify Your Email - SyncSpace',
    html
  });
};

/**
 * Send password reset email
 */
const sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #4F46E5;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .content {
          background-color: #f9f9f9;
          padding: 30px;
          border-radius: 0 0 5px 5px;
        }
        .button {
          display: inline-block;
          padding: 12px 30px;
          background-color: #4F46E5;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
        }
        .warning {
          background-color: #FEF3C7;
          padding: 15px;
          border-left: 4px solid #F59E0B;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          color: #666;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <p>Hi ${user.name},</p>
          <p>We received a request to reset your password for your SyncSpace account.</p>
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #4F46E5;">${resetUrl}</p>
          <div class="warning">
            <strong>Security Notice:</strong>
            <ul>
              <li>This link will expire in 1 hour</li>
              <li>If you didn't request a password reset, please ignore this email</li>
              <li>Your password will not change until you access the link above and create a new one</li>
            </ul>
          </div>
          <p>Best regards,<br>The SyncSpace Team</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} SyncSpace. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: user.email,
    subject: 'Password Reset Request - SyncSpace',
    html
  });
};

/**
 * Send workspace invitation email
 */
const sendWorkspaceInvitationEmail = async (recipientEmail, workspace, invitedBy, invitationToken) => {
  const invitationUrl = `${process.env.FRONTEND_URL}/accept-invitation/${invitationToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #4F46E5;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .content {
          background-color: #f9f9f9;
          padding: 30px;
          border-radius: 0 0 5px 5px;
        }
        .button {
          display: inline-block;
          padding: 12px 30px;
          background-color: #4F46E5;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
        }
        .workspace-info {
          background-color: white;
          padding: 15px;
          border-radius: 5px;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          color: #666;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Workspace Invitation</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p><strong>${invitedBy.name}</strong> has invited you to join their workspace on SyncSpace.</p>
          <div class="workspace-info">
            <h3>${workspace.name}</h3>
            <p>${workspace.description || 'No description provided'}</p>
          </div>
          <div style="text-align: center;">
            <a href="${invitationUrl}" class="button">Accept Invitation</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #4F46E5;">${invitationUrl}</p>
          <p>This invitation will expire in 7 days.</p>
          <p>Best regards,<br>The SyncSpace Team</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} SyncSpace. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: recipientEmail,
    subject: `You've been invited to join ${workspace.name} on SyncSpace`,
    html
  });
};

/**
 * Send task assignment notification email
 */
const sendTaskAssignmentEmail = async (user, task, project, assignedBy) => {
  const taskUrl = `${process.env.FRONTEND_URL}/projects/${project._id}/tasks/${task._id}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #4F46E5;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .content {
          background-color: #f9f9f9;
          padding: 30px;
          border-radius: 0 0 5px 5px;
        }
        .button {
          display: inline-block;
          padding: 12px 30px;
          background-color: #4F46E5;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
        }
        .task-info {
          background-color: white;
          padding: 15px;
          border-radius: 5px;
          margin: 20px 0;
        }
        .priority {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 3px;
          font-size: 12px;
          font-weight: bold;
        }
        .priority-high { background-color: #FEE2E2; color: #991B1B; }
        .priority-medium { background-color: #FEF3C7; color: #92400E; }
        .priority-low { background-color: #DBEAFE; color: #1E40AF; }
        .footer {
          text-align: center;
          margin-top: 20px;
          color: #666;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Task Assignment</h1>
        </div>
        <div class="content">
          <p>Hi ${user.name},</p>
          <p><strong>${assignedBy.name}</strong> has assigned you a new task.</p>
          <div class="task-info">
            <h3>${task.title}</h3>
            <p><strong>Project:</strong> ${project.name}</p>
            <p><strong>Priority:</strong> <span class="priority priority-${task.priority}">${task.priority.toUpperCase()}</span></p>
            ${task.dueDate ? `<p><strong>Due Date:</strong> ${new Date(task.dueDate).toLocaleDateString()}</p>` : ''}
            ${task.description ? `<p><strong>Description:</strong> ${task.description}</p>` : ''}
          </div>
          <div style="text-align: center;">
            <a href="${taskUrl}" class="button">View Task</a>
          </div>
          <p>Best regards,<br>The SyncSpace Team</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} SyncSpace. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: user.email,
    subject: `New Task Assignment: ${task.title}`,
    html
  });
};

/**
 * Send deadline reminder email
 */
const sendDeadlineReminderEmail = async (user, task, project) => {
  const taskUrl = `${process.env.FRONTEND_URL}/projects/${project._id}/tasks/${task._id}`;
  const daysUntilDue = Math.ceil((new Date(task.dueDate) - new Date()) / (1000 * 60 * 60 * 24));

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #F59E0B;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .content {
          background-color: #f9f9f9;
          padding: 30px;
          border-radius: 0 0 5px 5px;
        }
        .button {
          display: inline-block;
          padding: 12px 30px;
          background-color: #F59E0B;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
        }
        .task-info {
          background-color: white;
          padding: 15px;
          border-radius: 5px;
          margin: 20px 0;
        }
        .warning {
          background-color: #FEF3C7;
          padding: 15px;
          border-left: 4px solid #F59E0B;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          color: #666;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⏰ Task Deadline Reminder</h1>
        </div>
        <div class="content">
          <p>Hi ${user.name},</p>
          <div class="warning">
            <p><strong>Your task is due ${daysUntilDue === 0 ? 'today' : `in ${daysUntilDue} day${daysUntilDue > 1 ? 's' : ''}`}!</strong></p>
          </div>
          <div class="task-info">
            <h3>${task.title}</h3>
            <p><strong>Project:</strong> ${project.name}</p>
            <p><strong>Due Date:</strong> ${new Date(task.dueDate).toLocaleDateString()}</p>
            <p><strong>Status:</strong> ${task.status}</p>
          </div>
          <div style="text-align: center;">
            <a href="${taskUrl}" class="button">View Task</a>
          </div>
          <p>Make sure to complete this task before the deadline.</p>
          <p>Best regards,<br>The SyncSpace Team</p>
        </div>
        <div class="footer">
        <p>&copy; ${new Date().getFullYear()} SyncSpace. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: user.email,
    subject: `Reminder: Task "${task.title}" is due soon`,
    html
  });
};

/**
 * Send welcome email
 */
const sendWelcomeEmail = async (user) => {
  const dashboardUrl = `${process.env.FRONTEND_URL}/dashboard`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #4F46E5;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .content {
          background-color: #f9f9f9;
          padding: 30px;
          border-radius: 0 0 5px 5px;
        }
        .button {
          display: inline-block;
          padding: 12px 30px;
          background-color: #4F46E5;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
        }
        .feature {
          background-color: white;
          padding: 15px;
          margin: 10px 0;
          border-radius: 5px;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          color: #666;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Welcome to SyncSpace!</h1>
        </div>
        <div class="content">
          <p>Hi ${user.name},</p>
          <p>Welcome to SyncSpace! We're excited to have you on board.</p>
          <p>SyncSpace is your all-in-one collaboration platform. Here's what you can do:</p>
          <div class="feature">
            <strong>📁 Workspaces</strong> - Organize your teams and projects
          </div>
          <div class="feature">
            <strong>📋 Kanban Boards</strong> - Manage tasks visually with drag-and-drop
          </div>
          <div class="feature">
            <strong>📝 Real-time Documents</strong> - Collaborate on documents with your team
          </div>
          <div class="feature">
            <strong>💬 Team Chat</strong> - Communicate instantly with your team
          </div>
          <div class="feature">
            <strong>📎 File Sharing</strong> - Share and manage files securely
          </div>
          <div style="text-align: center;">
            <a href="${dashboardUrl}" class="button">Get Started</a>
          </div>
          <p>If you have any questions, feel free to reach out to our support team.</p>
          <p>Happy collaborating!<br>The SyncSpace Team</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} SyncSpace. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: user.email,
    subject: 'Welcome to SyncSpace!',
    html
  });
};

/**
 * Send notification digest email
 */
const sendNotificationDigestEmail = async (user, notifications) => {
  const dashboardUrl = `${process.env.FRONTEND_URL}/notifications`;

  const notificationList = notifications.map(notif => `
    <div style="background-color: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #4F46E5;">
      <strong>${notif.title}</strong>
      <p style="margin: 5px 0; color: #666;">${notif.message}</p>
      <small style="color: #999;">${new Date(notif.createdAt).toLocaleString()}</small>
    </div>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #4F46E5;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .content {
          background-color: #f9f9f9;
          padding: 30px;
          border-radius: 0 0 5px 5px;
        }
        .button {
          display: inline-block;
          padding: 12px 30px;
          background-color: #4F46E5;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          color: #666;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📬 Your Daily Digest</h1>
        </div>
        <div class="content">
          <p>Hi ${user.name},</p>
          <p>Here's your daily summary of notifications from SyncSpace:</p>
          <p><strong>You have ${notifications.length} new notification${notifications.length !== 1 ? 's' : ''}:</strong></p>
          ${notificationList}
          <div style="text-align: center;">
            <a href="${dashboardUrl}" class="button">View All Notifications</a>
          </div>
          <p>Best regards,<br>The SyncSpace Team</p>
        </div>
        <div class="footer">
          <p>You're receiving this email because you've subscribed to daily notification digests.</p>
          <p>&copy; ${new Date().getFullYear()} SyncSpace. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: user.email,
    subject: `Your Daily Digest - ${notifications.length} New Notification${notifications.length !== 1 ? 's' : ''}`,
    html
  });
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWorkspaceInvitationEmail,
  sendTaskAssignmentEmail,
  sendDeadlineReminderEmail,
  sendWelcomeEmail,
  sendNotificationDigestEmail
};