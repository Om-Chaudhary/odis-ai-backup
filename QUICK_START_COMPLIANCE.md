# Quick Start: Compliance Pages

Get your compliance pages customized and deployed in 15 minutes.

## Immediate Steps

### 1. Update Company Information (2 minutes)

Edit these files and replace the constants at the top:

**Privacy Policy**:
```bash
# File: src/app/privacy-policy/content.tsx
# Update lines 10-15
```

**Terms of Service**:
```bash
# File: src/app/terms-of-service/content.tsx
# Update lines 10-16
```

Replace:
```typescript
export const COMPANY_NAME = "COMPANY_NAME";           // → "Odis AI"
export const CONTACT_EMAIL = "privacy@company.com";   // → "privacy@odisai.net"
export const COMPANY_ADDRESS = "123 Business...";    // → Your actual address
export const LAST_UPDATED = "January 1, 2025";       // → Today's date
export const EFFECTIVE_DATE = "January 1, 2025";     // → Effective date
```

### 2. Search and Replace Placeholders (1 minute)

In your editor (VS Code, Cursor, etc.):

1. Open Find & Replace (Cmd/Ctrl + Shift + H)
2. Find: `COMPANY_NAME`
3. Replace with: `Odis AI` (or your company name)
4. Search in: `src/app/privacy-policy/` and `src/app/terms-of-service/`
5. Replace All

### 3. Review TODO Comments (5 minutes)

Search for all TODOs:
```bash
grep -r "TODO:" src/app/privacy-policy/content.tsx
grep -r "TODO:" src/app/terms-of-service/content.tsx
```

Or in your editor:
- Open search (Cmd/Ctrl + Shift + F)
- Search: `TODO:`
- Review each occurrence

Critical TODOs to address:
- [ ] Contact information (email, address, phone)
- [ ] Third-party services list (match your actual services)
- [ ] GDPR/CCPA sections (if applicable to your business)
- [ ] Chrome extension permissions (if you have one)
- [ ] Storage location/region
- [ ] Governing law jurisdiction (Terms of Service)

### 4. Test Locally (2 minutes)

```bash
# Start development server
pnpm dev

# Open browser:
http://localhost:3000/privacy-policy
http://localhost:3000/terms-of-service

# Test:
- Click table of contents links
- Scroll down (back to top button should appear)
- Print preview (Cmd/Ctrl + P)
- Tab through page (keyboard navigation)
```

### 5. Legal Review (REQUIRED)

**STOP**: Do not publish without legal review!

- [ ] Send content to legal counsel
- [ ] Get approval before deploying
- [ ] Make any requested changes
- [ ] Update dates after final approval

### 6. Deploy (1 minute)

```bash
# Build for production
pnpm build

# Test production build
pnpm start

# Deploy (if using Vercel)
vercel deploy --prod

# Or push to main branch
git add .
git commit -m "Add compliance pages"
git push origin main
```

## Checklist Before Publishing

### Content (15 items)
- [ ] Company name updated everywhere
- [ ] Contact email updated
- [ ] Contact address updated
- [ ] Contact phone added (if applicable)
- [ ] Last updated date is today
- [ ] Effective date is set
- [ ] Third-party services list matches reality
- [ ] GDPR section matches your data practices
- [ ] CCPA section matches your data practices
- [ ] Chrome extension section (if applicable)
- [ ] Storage location/region specified
- [ ] Governing law jurisdiction set
- [ ] All TODO comments addressed
- [ ] Links to other pages work
- [ ] **Legal counsel has reviewed and approved**

### Functionality (8 items)
- [ ] Table of contents links work
- [ ] Back to top button appears
- [ ] Smooth scrolling works
- [ ] Print view looks good
- [ ] Mobile responsive
- [ ] Keyboard navigation works
- [ ] Footer links updated
- [ ] All pages load without errors

### Accessibility (5 items)
- [ ] Keyboard navigation (Tab through page)
- [ ] Skip to content link works
- [ ] Screen reader friendly
- [ ] Color contrast sufficient
- [ ] Focus indicators visible

## Common Customizations

### Add a New Section

In `content.tsx`:
```typescript
export const privacyPolicySections: ComplianceSection[] = [
  // ... existing sections
  {
    id: "new-section",  // Must be unique, kebab-case
    title: "New Section Title",
    content: (
      <>
        <p>Your content here...</p>
        <ul>
          <li>Item 1</li>
          <li>Item 2</li>
        </ul>
      </>
    ),
  },
];
```

### Remove a Section

Simply delete the section object from the array. The table of contents will update automatically.

### Reorder Sections

Cut and paste section objects in the array. Numbering updates automatically.

### Add Subsections

```typescript
{
  id: "main-section",
  title: "Main Section",
  content: <p>Main content...</p>,
  subsections: [
    {
      id: "sub-1",
      title: "Subsection 1",
      content: <p>Subsection content...</p>,
    },
    {
      id: "sub-2",
      title: "Subsection 2",
      content: <p>More content...</p>,
    },
  ],
}
```

### Update Third-Party Services

In Privacy Policy content.tsx, find the "Categories of Service Providers" subsection and update the list:

```typescript
<ul>
  <li>
    <strong>Infrastructure:</strong> Vercel, Supabase
  </li>
  <li>
    <strong>Analytics:</strong> PostHog
  </li>
  <li>
    <strong>Payment:</strong> Stripe
  </li>
  {/* Add your actual services */}
</ul>
```

## Quick Links

### Documentation
- [Full Implementation Summary](IMPLEMENTATION_SUMMARY.md)
- [Detailed Customization Guide](COMPLIANCE_PAGES_GUIDE.md)
- [Component README](src/components/legal/README.md)

### Live Pages (after deployment)
- Privacy Policy: `https://yourdomain.com/privacy-policy`
- Terms of Service: `https://yourdomain.com/terms-of-service`
- Cookie Policy: `https://yourdomain.com/cookie-policy` (create when needed)

### Files to Edit
- Privacy content: `src/app/privacy-policy/content.tsx`
- Terms content: `src/app/terms-of-service/content.tsx`
- Component: `src/components/legal/compliance-document.tsx`
- Footer links: `src/components/Footer.tsx`

## Troubleshooting

### Table of contents links don't work
- Ensure each section has a unique `id`
- IDs should be kebab-case (lowercase, hyphens)
- Check browser console for errors

### TypeScript errors
```bash
pnpm typecheck
```
Fix any type errors before deploying.

### Styling issues
- Component uses Tailwind CSS
- Check that Tailwind is configured
- Verify `globals.css` is imported

### Footer links 404
- Verify routes exist:
  - `/privacy-policy`
  - `/terms-of-service`
  - `/cookie-policy` (if created)
- Check `src/app/` directory structure

### Print styles not working
- Test in different browsers
- Use Print Preview (Cmd/Ctrl + P)
- Check inline print styles in component

## Need Help?

1. Check [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) for full details
2. Review [COMPLIANCE_PAGES_GUIDE.md](COMPLIANCE_PAGES_GUIDE.md) for customization
3. Read component docs at [src/components/legal/README.md](src/components/legal/README.md)
4. For legal questions, consult with qualified legal counsel

## Pro Tips

1. **Version Control**: Commit your changes before major edits
2. **Test Locally**: Always test in dev mode before deploying
3. **Legal First**: Never publish without legal review
4. **Update Dates**: Change `LAST_UPDATED` whenever you edit content
5. **Mobile Test**: View on actual mobile devices
6. **Accessibility**: Use keyboard and screen reader to test
7. **Keep Copies**: Save old versions when making major updates
8. **Regular Review**: Schedule quarterly reviews to keep content current

## Timeline

- **Minutes 0-2**: Update company information
- **Minutes 2-3**: Search and replace placeholders
- **Minutes 3-8**: Review and address TODO comments
- **Minutes 8-10**: Test locally
- **Minutes 10-14**: Make any final adjustments
- **Minute 14**: Request legal review
- **After approval**: Deploy to production

## What's Next?

After completing this quick start:

1. **Create Cookie Policy** (if needed)
   - Copy structure from Terms of Service
   - Customize content for cookies
   - Follow same pattern

2. **Add to Navigation** (if desired)
   - Update main nav to include legal links
   - Add to sitemap for SEO

3. **Set Up Monitoring**
   - Track page views in PostHog
   - Monitor 404 errors
   - Check accessibility scores

4. **Schedule Reviews**
   - Calendar quarterly content reviews
   - Track legal/regulatory changes
   - Update as services evolve

---

**Ready to Start?** Follow the 6 steps above and you'll have professional compliance pages in 15 minutes (plus legal review time).

**Remember**: Legal review is NOT optional. Always get approval before publishing.
