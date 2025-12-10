# HelloACA Supabase Email Templates Setup Guide

This guide will help you configure the HelloACA email templates in your Supabase Dashboard for authentication emails.

## Prerequisites

- Access to your Supabase Dashboard
- HelloACA project with authentication enabled
- Email templates files located in `src/config/email-templates/`

## Setup Instructions

### 1. Access Supabase Dashboard

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your HelloACA project
3. Navigate to **Authentication** > **Email Templates**

### 2. Configure Each Email Template

For each template type, follow these steps:

#### A. Confirm Signup Template
1. Click on **Confirm signup** template
2. Replace the existing HTML with the content from `src/config/email-templates/confirm-signup.html`
3. Update the subject line to: `Confirm your email address - HelloACA`
4. Click **Save**

#### B. Invite User Template
1. Click on **Invite user** template
2. Replace the existing HTML with the content from `src/config/email-templates/invite-user.html`
3. Update the subject line to: `You've been invited to join HelloACA`
4. Click **Save**

#### C. Magic Link Template
1. Click on **Magic Link** template
2. Replace the existing HTML with the content from `src/config/email-templates/magic-link.html`
3. Update the subject line to: `Your HelloACA sign-in link`
4. Click **Save**

#### D. Change Email Address Template
1. Click on **Change email address** template
2. Replace the existing HTML with the content from `src/config/email-templates/change-email.html`
3. Update the subject line to: `Confirm your new email address - HelloACA`
4. Click **Save**

#### E. Reset Password Template
1. Click on **Reset password** template
2. Replace the existing HTML with the content from `src/config/email-templates/reset-password.html`
3. Update the subject line to: `Reset your HelloACA password`
4. Click **Save**

#### F. Reauthentication Template
1. Click on **Reauthentication** template
2. Replace the existing HTML with the content from `src/config/email-templates/reauthentication.html`
3. Update the subject line to: `Verify your identity - HelloACA`
4. Click **Save**

### 3. Important Variables

**DO NOT MODIFY** these Supabase template variables - they will be automatically replaced:
- `{{ .ConfirmationURL }}` - The action URL for the email
- `{{ .Email }}` - The recipient's email address
- `{{ .SiteURL }}` - Your site URL

### 4. Brand Customization

The templates are already customized with HelloACA branding:
- **Primary Color**: #4ECCA3 (HelloACA green)
- **Secondary Color**: #000000 (Black)
- **Font**: Inter (matching website typography)
- **Logo**: https://preview.helloaca.xyz/logo.png
- **Website**: https://preview.helloaca.xyz
- **Support Email**: support@helloaca.xyz

### 5. Testing

Before going live, test each template:

1. **Test Signup Flow**:
   - Create a test account
   - Check the confirmation email format

2. **Test Password Reset**:
   - Use "Forgot Password" feature
   - Verify the reset email appearance

3. **Test Magic Link**:
   - Use passwordless login
   - Confirm the magic link email

4. **Test Email Change**:
   - Change email in user settings
   - Verify the confirmation email

### 6. Email Client Compatibility

The templates are designed for maximum compatibility:
- ✅ Gmail
- ✅ Outlook
- ✅ Apple Mail
- ✅ Yahoo Mail
- ✅ Mobile email clients
- ✅ Dark mode support

### 7. Troubleshooting

**Common Issues:**

1. **Logo not displaying**:
   - Ensure `https://preview.helloaca.xyz/logo.png` is publicly accessible
   - Check image dimensions (recommended: 40px height)

2. **Colors not showing**:
   - Verify inline CSS is preserved
   - Some email clients may override styles

3. **Links not working**:
   - Ensure Supabase variables are not modified
   - Check redirect URLs in Supabase settings

4. **Template not updating**:
   - Clear browser cache
   - Wait a few minutes for changes to propagate

### 8. Maintenance

**Regular Tasks:**
- Update copyright year annually
- Verify logo URL accessibility
- Test templates after Supabase updates
- Monitor email deliverability

### 9. Advanced Customization

To further customize templates:

1. **Modify Colors**:
   - Update `background-color` and `color` attributes
   - Maintain contrast ratios for accessibility

2. **Change Layout**:
   - Adjust padding and margin values
   - Modify table structure carefully

3. **Add Content**:
   - Include additional company information
   - Add social media links
   - Insert promotional content

### 10. Support

For technical support:
- Email: support@helloaca.xyz
- Documentation: [Supabase Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)

---

**Note**: Always backup existing templates before making changes. Test thoroughly in a staging environment before deploying to production.
