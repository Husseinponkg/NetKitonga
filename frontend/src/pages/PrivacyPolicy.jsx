
import "./PrivacyPolicy.css";
import React from "react";

export default function PrivacyPolicy() {
  return (
    <main className="privacy-page">
      <div className="privacy-container">
        <a href="/" className="privacy-back">
          ← Back to NetKitonga
        </a>

        <header className="privacy-header">
          <span className="privacy-label">LEGAL & PRIVACY</span>

          <h1>Privacy Policy</h1>

          <p>
            Your privacy matters to us. This policy explains how
            NetKitonga collects, uses, stores, and protects information
            when you use our services.
          </p>

          <p className="privacy-updated">
            
          </p>
        </header>

        <section>
          <h2>1. About NetKitonga</h2>

          <p>
            NetKitonga provides Wi-Fi billing, hotspot management,
            subscription management, and related network services
            to businesses and their customers.
          </p>
        </section>

        <section>
          <h2>2. Information We Collect</h2>

          <p>Depending on how you use our services, we may collect:</p>

          <ul>
            <li>
              <strong>Account information:</strong> Business name,
              owner's name, email address, and phone number.
            </li>

            <li>
              <strong>Customer information:</strong> Information
              submitted when registering or purchasing a Wi-Fi package.
            </li>

            <li>
              <strong>Network information:</strong> Device MAC address,
              assigned IP address, router information, connection times,
              and session usage records.
            </li>

            <li>
              <strong>Payment information:</strong> Transaction references,
              payment status, package purchased, and other necessary
              payment records.
            </li>

            <li>
              <strong>Technical information:</strong> Information needed
              to maintain service security, diagnose errors, and prevent
              misuse.
            </li>
          </ul>
        </section>

        <section>
          <h2>3. How We Use Information</h2>

          <p>We may use collected information to:</p>

          <ul>
            <li>Create and manage business accounts.</li>
            <li>Authenticate users accessing Wi-Fi services.</li>
            <li>Process package purchases and verify payments.</li>
            <li>Manage subscriptions, vouchers, and active sessions.</li>
            <li>Monitor usage and troubleshoot network problems.</li>
            <li>Prevent fraud, unauthorized access, and abuse.</li>
            <li>Provide customer support and improve our services.</li>
          </ul>
        </section>

        <section>
          <h2>4. Payments and Third-Party Services</h2>

          <p>
            NetKitonga may use third-party payment providers and
            infrastructure services to deliver its services. These
            providers may process information necessary to complete
            transactions or operate the platform.
          </p>

          <p>
            Payment details are handled according to the applicable
            provider's policies and the payment integration being used.
            We do not claim to store or process full payment credentials
            unless our actual implementation requires it.
          </p>
        </section>

        <section>
          <h2>5. Sharing of Information</h2>

          <p>
            We do not sell personal information. Information may be
            shared when necessary with the business operating a Wi-Fi
            hotspot, service providers supporting the platform, or
            authorized parties where required by law.
          </p>
        </section>

        <section>
          <h2>6. Data Security</h2>

          <p>
            We use appropriate technical and organizational measures
            intended to protect information against unauthorized access,
            loss, misuse, or disclosure. However, no internet service
            can guarantee absolute security.
          </p>
        </section>

        <section>
          <h2>7. Data Retention</h2>

          <p>
            Information is retained for as long as necessary to provide
            the service, maintain relevant transaction and security
            records, resolve disputes, and meet applicable legal
            obligations. Retention periods depend on the type of
            information and its purpose.
          </p>
        </section>

        <section>
          <h2>8. Your Privacy Rights</h2>

          <p>
            Depending on applicable law, you may have rights to request
            access to, correction of, or deletion of your personal
            information, or to object to certain processing.
          </p>

          <p>
            Contact us to submit a privacy request. We may need to
            verify your identity before processing it.
          </p>
        </section>

        <section>
          <h2>9. Children's Privacy</h2>

          <p>
            NetKitonga is a business and network management service.
            Businesses using the platform are responsible for ensuring
            that their collection and use of customer information
            complies with applicable privacy requirements.
          </p>
        </section>

        <section>
          <h2>10. Changes to This Policy</h2>

          <p>
            We may update this policy as our services or legal
            obligations change. The latest version will be published
            on this page with an updated revision date.
          </p>
        </section>

      <section>
  <h2>11. Contact Us</h2>

  <p>
    If you have any questions about this Privacy Policy, your
    personal information, or how NetKitonga handles your data,
    please contact us using the details below.
  </p>

  <p>
    <strong>Email:</strong>{" "}
    <a href="mailto:fontwandell@outlook.com">
      fontwandell@outlook.com
    </a>
  </p>

  <p>
    <strong>WhatsApp:</strong>{" "}
    <a
      href="https://wa.me/255792476367"
      target="_blank"
      rel="noopener noreferrer"
    >
      +255 792 476 367
    </a>
  </p>

  <p>
    <strong>Website:</strong>{" "}
    <a
      href="https://netkitonga.com"
      target="_blank"
      rel="noopener noreferrer"
    >
      https://netkitonga.com
    </a>
  </p>
</section>

        <footer className="privacy-footer">
          <p>© {new Date().getFullYear()} FontWandell. All rights reserved.</p>
        </footer>
      </div>
    </main>
  );
}
