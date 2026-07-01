// /privacy — public. TEMPLATE tailored to Sprint Society's real data flows
// (account, activity/health, payments via Razorpay, AI coach via Anthropic,
// Google OAuth, optional Strava, Supabase/Vercel hosting). NEEDS LEGAL REVIEW
// before launch — see the banner. Copy lives here so legal can edit in one file.
import { LegalLayout, LegalSection, LegalList } from '../components/legal/LegalLayout';
import { SUPPORT_EMAIL, LEGAL_ENTITY, GOVERNING_LAW } from '../lib/support';

export function PrivacyPolicyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      otherLabel="Read our Terms & Conditions"
      otherTo="/terms"
      intro={`This policy explains what ${LEGAL_ENTITY} ("Sprint Society", "we") collects when you use the app, why, who we share it with, and the choices you have. By using Sprint Society you agree to this policy.`}
    >
      <div className="ss-surface" style={{ borderRadius: 12, padding: '11px 13px', borderLeft: '2px solid var(--amber)', marginTop: 18 }}>
        <p style={{ font: '600 11px var(--head)', color: 'var(--amber)', marginBottom: 3 }}>Template — pending legal review</p>
        <p style={{ font: '400 11.5px/1.5 var(--body)', color: 'var(--muted)' }}>
          This is an accurate draft based on how the app actually processes data, but it must be reviewed by counsel and localized (India DPDP Act / GDPR where applicable) before public launch.
        </p>
      </div>

      <LegalSection heading="1. Information we collect">
        <p>We collect only what the app needs to work:</p>
        <LegalList items={[
          <><b>Account</b> — name, email, and/or Indian phone number, and a securely hashed password. If you sign in with Google we receive your name, email, and Google ID.</>,
          <><b>Activity & health data</b> — your runs (distance, time, pace, GPS route, splits), heart-rate and HRV readings, wellness logs (sleep, stress, energy), personal records, and training preferences you enter.</>,
          <><b>Payment</b> — subscription plan and payment status. Card/UPI details are handled entirely by our payment processor (Razorpay); we never see or store them.</>,
          <><b>Usage & device</b> — app interactions, approximate location for nearby events (only with your permission), and basic device/browser info.</>,
        ]} />
      </LegalSection>

      <LegalSection heading="2. How we use it">
        <LegalList items={[
          'Deliver core features: tier classification, pace zones, training plans, records, and progress.',
          'Power the AI coach — relevant training data is sent to our AI provider to generate coaching responses (see §4).',
          'Process subscriptions and payments.',
          'Send account and service messages (e.g. password reset, email verification).',
          'Improve the product with aggregated, non-identifying analytics — only if you accept analytics cookies.',
        ]} />
      </LegalSection>

      <LegalSection heading="3. Cookies & analytics">
        <p>Essential cookies keep you signed in and are always on. Analytics cookies are used only after you choose "Accept all" in the cookie banner; choose "Essential only" and we do not load analytics. You can clear the choice anytime by clearing site data.</p>
      </LegalSection>

      <LegalSection heading="4. Who we share data with">
        <p>We do not sell your data. We share the minimum necessary with service providers who process it on our behalf:</p>
        <LegalList items={[
          <><b>Razorpay</b> — payment processing.</>,
          <><b>Anthropic (Claude)</b> — AI coaching. Training context is sent to generate responses; it is not used to train their models per their API terms.</>,
          <><b>Google</b> — sign-in (OAuth), if you use it.</>,
          <><b>Strava</b> — only if you connect it, to import your activities.</>,
          <><b>Supabase & Vercel</b> — database and hosting.</>,
        ]} />
        <p>We may also disclose data where required by law.</p>
      </LegalSection>

      <LegalSection heading="5. Data retention">
        <p>We keep your data while your account is active. Delete your account and we remove your personal data within a reasonable period, except where we must retain records (e.g. payment history) to meet legal obligations.</p>
      </LegalSection>

      <LegalSection heading="6. Your rights">
        <p>You can access, correct, export, or delete your data. To exercise any right, email <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: 'var(--violet-2)' }}>{SUPPORT_EMAIL}</a>. Depending on where you live (e.g. India’s DPDP Act or the EU GDPR) you may have additional rights, including lodging a complaint with a regulator.</p>
      </LegalSection>

      <LegalSection heading="7. Security">
        <p>Passwords are hashed, traffic is encrypted in transit, and access is rate-limited. No system is perfectly secure, but we work to protect your data and will notify you of a material breach as required by law.</p>
      </LegalSection>

      <LegalSection heading="8. Children">
        <p>Sprint Society is not intended for children under 16 (or the minimum age in your country). We do not knowingly collect data from them.</p>
      </LegalSection>

      <LegalSection heading="9. Changes & contact">
        <p>We may update this policy; material changes will be notified in-app. Questions or requests: <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: 'var(--violet-2)' }}>{SUPPORT_EMAIL}</a>. Governing law: {GOVERNING_LAW}.</p>
      </LegalSection>
    </LegalLayout>
  );
}
