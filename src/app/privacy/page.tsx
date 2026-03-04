import Link from "next/link";

export default function PrivacyPolicyPage() {
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
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: March 2025
        </p>
        <div className="mt-10 space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground">
              1. Introduction
            </h2>
            <p>
              This Privacy Policy describes how Sunrise Budget
              (&quot;we,&quot; &quot;our,&quot; or the &quot;Service&quot;)
              handles information when you use our web-based budgeting tool. We
              do not collect your name, email, or account information. Your
              budget content is encrypted so we cannot read it. This policy
              explains what data exists, where it lives, and how we use it.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">
              2. Information We Do Not Collect
            </h2>
            <p>
              We do not require an account, email, or phone number. We do not
              track your browsing across other sites. We do not link to your
              bank or financial accounts. We do not collect your budget content
              in readable form. We do not use your data for advertising or sell
              it to third parties.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">
              3. End-to-End Encryption and What We Cannot See
            </h2>
            <p>
              Your budget (income and expense entries, amounts, categories,
              etc.) is encrypted on your device using a key derived from your
              passphrase. We never receive your passphrase or the key. We cannot
              decrypt your budget. Only someone with your passphrase (or an
              exported file you provide) can read the content. For long-term
              storage (local storage) and sync we only ever see or store
              ciphertext. While you use the app, decrypted data and the key
              exist temporarily in session storage (cleared when you close the
              tab) so you can reload without re-entering your passphrase.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">
              4. Data Stored in Your Browser
            </h2>
            <p>
              When you use the Service, your browser may store: (a) a random
              salt used for key derivation (not your passphrase); (b) a budget
              identifier (a random UUID); (c) in local storage: your budget data
              in encrypted form (persists until you clear it); and (d) in
              session storage: your budget data in decrypted form and the
              decryption key, only for the duration of your tab session—cleared
              when you close the tab. Clearing your browser&apos;s local storage
              will remove the encrypted copy; export or sync your budget first
              if you want to keep a copy elsewhere.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">
              5. Optional Sync to Our Servers
            </h2>
            <p>
              If you use the sync feature, your browser sends encrypted budget
              data and the budget identifier to our servers so you can access
              the same budget from another device. We store only the encrypted
              blob associated with that identifier. We cannot read the contents.
              We may retain this data until you overwrite it, delete it (if we
              provide that option), or we discontinue the feature. Our hosting
              and storage providers process this data to operate the Service;
              they do not have access to your passphrase or decryption key.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">
              6. Technical and Log Data
            </h2>
            <p>
              When you visit the site or use sync, our infrastructure (e.g.
              hosting and content delivery) may automatically receive
              information such as your IP address, browser type, and request
              timing. We use this only to operate and secure the Service. We do
              not use it to identify you or to build a profile of your activity.
              Our providers may have their own logging and privacy policies.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">
              7. How We Use Information
            </h2>
            <p>
              We use the information described above only to provide and improve
              the Service: to store and retrieve your encrypted sync data, to
              run the application, and to prevent abuse. We do not use your data
              for marketing, advertising, or selling to third parties.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">
              8. Sharing and Third Parties
            </h2>
            <p>
              We do not sell or rent your data. We may use third-party services
              (e.g. hosting and blob storage) to run the Service; they process
              data on our behalf and are bound by their own privacy and security
              obligations. We may disclose information if required by law (e.g.
              subpoena or court order) or to protect our rights or safety.
              Because we cannot decrypt your budget, we cannot produce its
              contents in response to such requests.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">
              9. Your Choices and Control
            </h2>
            <p>
              You control your passphrase and who you share it with. You can
              choose not to use sync and keep data only in your browser. You can
              clear local storage to remove encrypted data, and close the tab to
              clear session storage. You can export your budget and use or share
              the file as you decide. Because we do not have accounts or
              readable budget content, we cannot &quot;look up&quot; or delete
              your budget by identity; if we add tools to delete sync data by
              budget identifier, we will describe them in the Service.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">
              10. Security
            </h2>
            <p>
              We use industry-standard encryption (e.g. AES-GCM) for your budget
              data. We do not have the keys to decrypt it. You are responsible
              for keeping your passphrase secure; anyone with your passphrase
              can decrypt your data. We take reasonable measures to protect our
              systems and the encrypted data we store, but no system is
              completely secure.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">
              11. Children
            </h2>
            <p>
              The Service is not directed at children under 13. We do not
              knowingly collect personal information from children under 13. If
              you believe a child has provided information through the Service,
              contact us and we will work to delete it to the extent we can
              identify it (recognizing that we do not collect account or
              identity information).
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">
              12. Your Rights (e.g. GDPR, CCPA)
            </h2>
            <p>
              Depending on where you live, you may have rights to access,
              correct, delete, or port your data, or to object to or restrict
              processing. Because we do not collect your identity or readable
              budget content, we often cannot associate data with a particular
              person. You can stop using the Service, clear local storage, and
              avoid using sync. If you have a specific request (e.g. deletion of
              sync data associated with a budget identifier), contact us and we
              will respond in line with applicable law.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">
              13. International Use and Transfers
            </h2>
            <p>
              The Service may be hosted and processed in the United States or
              elsewhere. If you use the Service from another country, your data
              may be transferred to and processed in those jurisdictions. By
              using the Service you consent to such transfer to the extent
              permitted by your local law.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">
              14. Changes to This Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. We will post
              the updated policy and change the &quot;Last updated&quot; date.
              Your continued use of the Service after changes means you accept
              the updated policy. If you do not agree, please stop using the
              Service.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">
              15. Contact
            </h2>
            <p>
              For privacy-related questions or to exercise your rights, contact
              the operator through the means provided at{" "}
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
