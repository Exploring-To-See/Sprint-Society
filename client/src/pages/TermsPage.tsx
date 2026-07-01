// /terms — public. TEMPLATE tailored to Sprint Society (paid subscription running
// app, Razorpay, AI coaching, health/training content). NEEDS LEGAL REVIEW before
// launch. The health disclaimer (§6) is important for a training product.
import { LegalLayout, LegalSection, LegalList } from '../components/legal/LegalLayout';
import { SUPPORT_EMAIL, LEGAL_ENTITY, GOVERNING_LAW } from '../lib/support';

export function TermsPage() {
  return (
    <LegalLayout
      title="Terms & Conditions"
      otherLabel="Read our Privacy Policy"
      otherTo="/privacy"
      intro={`These terms govern your use of Sprint Society, operated by ${LEGAL_ENTITY}. By creating an account or using the app, you agree to them.`}
    >
      <div className="ss-surface" style={{ borderRadius: 12, padding: '11px 13px', borderLeft: '2px solid var(--amber)', marginTop: 18 }}>
        <p style={{ font: '600 11px var(--head)', color: 'var(--amber)', marginBottom: 3 }}>Template — pending legal review</p>
        <p style={{ font: '400 11.5px/1.5 var(--body)', color: 'var(--muted)' }}>
          Draft terms reflecting the current product. Have counsel review and localize before public launch.
        </p>
      </div>

      <LegalSection heading="1. Eligibility & account">
        <p>You must be at least 16 (or the minimum age where you live) to use Sprint Society. You are responsible for your account credentials and for activity under your account. Provide accurate information and keep it current.</p>
      </LegalSection>

      <LegalSection heading="2. The service">
        <p>Sprint Society provides run tracking, AI coaching, training plans, gamification, and community features. We may add, change, or remove features over time.</p>
      </LegalSection>

      <LegalSection heading="3. Subscriptions & payments">
        <LegalList items={[
          'Paid plans are billed through Razorpay in Indian Rupees at the price shown at checkout.',
          'Subscriptions renew automatically unless cancelled before the renewal date. You can cancel anytime; access continues until the end of the paid period.',
          'You may upgrade or downgrade; changes take effect per the in-app terms shown at the time.',
          'Except where required by law, payments are non-refundable once a billing period has started.',
        ]} />
      </LegalSection>

      <LegalSection heading="4. Acceptable use">
        <p>Don’t misuse the service. In particular, do not:</p>
        <LegalList items={[
          'Break the law, infringe others’ rights, or upload harmful or abusive content.',
          'Attempt to breach security, scrape at scale, or disrupt the service.',
          'Share false activity data or manipulate leaderboards, challenges, or the Kendu economy.',
        ]} />
        <p>We may suspend or terminate accounts that violate these terms.</p>
      </LegalSection>

      <LegalSection heading="5. Community & user content">
        <p>You retain ownership of content you post (posts, comments, run cards). You grant us a licence to host and display it to operate the service. Keep community interactions respectful; we may remove content or restrict accounts that violate our rules.</p>
      </LegalSection>

      <LegalSection heading="6. Health disclaimer">
        <p><b>Sprint Society is not a medical service and does not provide medical advice.</b> Training plans, pace zones, readiness, and AI coaching are informational and generated from your data — they are not a substitute for professional advice. Consult a qualified physician before starting or changing any exercise program, and stop and seek help if you feel unwell. You train at your own risk.</p>
      </LegalSection>

      <LegalSection heading="7. Intellectual property">
        <p>The app, brand, and content (excluding your data and content) belong to {LEGAL_ENTITY}. You may not copy, resell, or reverse-engineer the service except as allowed by law.</p>
      </LegalSection>

      <LegalSection heading="8. Disclaimers & liability">
        <p>The service is provided “as is”. To the maximum extent permitted by law, we disclaim implied warranties and are not liable for indirect or consequential damages. Nothing here limits liability that cannot be limited by law.</p>
      </LegalSection>

      <LegalSection heading="9. Termination">
        <p>You may stop using the service and delete your account anytime. We may suspend or end access for violations or to comply with law. Some terms (e.g. IP, liability) survive termination.</p>
      </LegalSection>

      <LegalSection heading="10. Changes, law & contact">
        <p>We may update these terms; material changes will be notified in-app and continued use means acceptance. These terms are governed by the laws of {GOVERNING_LAW}. Questions: <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: 'var(--violet-2)' }}>{SUPPORT_EMAIL}</a>.</p>
      </LegalSection>
    </LegalLayout>
  );
}
