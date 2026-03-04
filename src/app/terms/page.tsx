import Link from "next/link";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-6 py-16 sm:px-8">
        <Link
          href="/"
          className="text-sm text-muted-foreground underline hover:text-foreground"
        >
          ← Back to Sunrise Budget
        </Link>
        <h1 className="mt-8 text-3xl font-bold text-foreground">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: March 2025
        </p>
        <div className="mt-10 space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground">
              1. Agreement
            </h2>
            <p>
              These Terms of Service (&quot;Terms&quot;) govern your use of
              Sunrise Budget (&quot;Service&quot;). By using the Service, you
              agree to these Terms. If you do not agree, do not use the Service.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">
              2. What the Service Is
            </h2>
            <p>
              Sunrise Budget is a web-based tool that lets you create and edit a
              budget by entering expected income and expenses (e.g. recurring or
              one-time), view summaries by month and year, export or import your
              budget data, and optionally sync encrypted data to our servers so
              you can access it from another device. The Service does not
              connect to your bank or other accounts, does not track actual
              transactions, and does not provide financial, tax, or legal
              advice.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">
              3. Your Passphrase and Data
            </h2>
            <p>
              Access to your budget is protected by a passphrase you choose.
              Your data is encrypted with a key derived from that passphrase.
              Encrypted data is stored in local storage and (if you use sync) on
              our servers; decrypted data and the key exist temporarily in
              session storage while you use the app (cleared when you close the
              tab). We do not store your passphrase and we cannot decrypt your
              data. You are responsible for keeping your passphrase confidential
              and for anyone you give it to (e.g. a partner or advisor). If you
              lose your passphrase, we cannot recover your data. You may share
              your budget by sharing your passphrase or an exported file; you
              are responsible for how you share and with whom.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">
              4. Acceptable Use
            </h2>
            <p>
              You may use the Service only for lawful purposes. You may not use
              it to violate any law, infringe others&apos; rights, transmit
              malware, abuse our systems or networks, or attempt to gain
              unauthorized access to any data or systems. We may suspend or
              terminate your access if we believe you have violated these Terms
              or abused the Service.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">
              5. Your Data and Our Rights
            </h2>
            <p>
              You keep ownership of your budget data. We do not claim ownership
              of it. The Service (software, design, branding) is owned by the
              operator. You may not copy, modify, or reverse-engineer the
              Service, or use it to build a competing product, except as allowed
              by law.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">
              6. Privacy
            </h2>
            <p>
              Our Privacy Policy describes how we handle information. Your
              budget content is encrypted; we do not read it. By using the
              Service you also agree to the Privacy Policy.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">
              7. No Professional Advice; Planning Only
            </h2>
            <p>
              The Service is for planning and forecasting only. It is not
              financial, tax, investment, or legal advice. You should not rely
              on it as the sole basis for financial decisions. Consult qualified
              professionals for advice tailored to your situation.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">
              8. Service Provided &quot;As Is&quot;
            </h2>
            <p>
              The Service is provided &quot;as is&quot; and &quot;as
              available.&quot; We do not guarantee that it will be error-free,
              secure, or uninterrupted, or that data will not be lost (e.g. if
              you clear browser storage or lose your passphrase). We disclaim
              all warranties, express or implied, to the fullest extent
              permitted by law.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">
              9. Limitation of Liability
            </h2>
            <p>
              To the fullest extent permitted by law, the operator and its
              affiliates shall not be liable for any indirect, incidental,
              special, consequential, or punitive damages, or for any loss of
              data, profits, or revenue, arising from your use or inability to
              use the Service. Our total liability for any claims related to the
              Service shall not exceed one hundred dollars (USD $100). Some
              jurisdictions do not allow certain limitations; in those
              jurisdictions, our liability will be limited to the maximum
              permitted by law.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">
              10. Indemnification
            </h2>
            <p>
              You agree to indemnify and hold harmless the operator and its
              affiliates from any claims, damages, or expenses (including
              reasonable attorneys&apos; fees) arising from your use of the
              Service, your violation of these Terms, or your violation of any
              third party&apos;s rights.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">
              11. Changes to the Service and These Terms
            </h2>
            <p>
              We may change or discontinue features of the Service at any time.
              We may update these Terms; we will post the updated Terms and
              update the &quot;Last updated&quot; date. Your continued use of
              the Service after changes means you accept the new Terms. If you
              do not agree, stop using the Service.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">
              12. Termination
            </h2>
            <p>
              You may stop using the Service at any time. We may suspend or
              terminate access to the Service (including sync) for any reason,
              including violation of these Terms. Sections that by their nature
              should survive (e.g. disclaimers, limitation of liability,
              indemnification) will survive termination.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">
              13. General
            </h2>
            <p>
              These Terms are the entire agreement between you and the operator
              regarding the Service. If any part is held unenforceable, the rest
              remains in effect. Our failure to enforce a term does not waive
              it. You may not assign these Terms; we may assign them. Governing
              law and venue will be the laws and courts of the operator&apos;s
              jurisdiction, unless required otherwise by your local law.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">
              14. Contact
            </h2>
            <p>
              For questions about these Terms, contact the operator through the
              means provided at{" "}
              <a
                href="https://sunrisebudget.com"
                className="underline hover:text-foreground"
              >
                sunrisebudget.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
