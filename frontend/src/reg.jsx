import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "./api";

function Register() {
    const navigate = useNavigate();

    const [registered, setRegistered] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [businessName, setBusinessName] = useState("");
    const [systemName, setSystemName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");

    const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [acceptedRefund, setAcceptedRefund] = useState(false);

    const registerUser = async (event) => {
        event.preventDefault();
        setError("");

        // Validate Privacy Policy acceptance
        if (!acceptedPrivacy) {
            setError(
                "Please accept the Privacy Policy before creating your account."
            );

            document.getElementById("acceptedPrivacy")?.focus();
            return;
        }

        // Validate Terms & Conditions acceptance
        if (!acceptedTerms) {
            setError(
                "Please accept the Terms & Conditions before creating your account."
            );

            document.getElementById("acceptedTerms")?.focus();
            return;
        }

        // Validate Refund Policy acceptance
        if (!acceptedRefund) {
            setError(
                "Please accept the Refund Policy before creating your account."
            );

            document.getElementById("acceptedRefund")?.focus();
            return;
        }

        // Validate form fields
        if (
            !businessName.trim() ||
            !systemName.trim() ||
            !email.trim() ||
            !password
        ) {
            setError("Please complete all required fields.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(
                `${API_BASE_URL}/auth/register`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        business_name: businessName.trim(),
                        system_name: systemName.trim(),
                        email: email.trim(),
                        password,
                        phone_number: phoneNumber.trim(),
                    }),
                }
            );

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    data.detail ||
                    data.message ||
                    "Failed to register user."
                );
            }

            setRegistered(true);
            setError("");

            window.setTimeout(() => {
                navigate("/");
            }, 1200);
        } catch (err) {
            setError(
                err.message ||
                "Something went wrong. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="nk-register-page">
            <style>{`
                .nk-register-page,
                .nk-register-page * { box-sizing: border-box; }

                .nk-register-page {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 48px 20px;
                    background:
                        radial-gradient(ellipse at 12% 18%, rgba(59,130,246,.08), transparent 34%),
                        linear-gradient(180deg, #fafaff 0%, #f5f6fa 100%);
                    color: #17172b;
                    font-family: Inter, "Segoe UI", system-ui, -apple-system, sans-serif;
                }

                .nk-register-container {
                    width: 100%;
                    max-width: 470px;
                    animation: nkRegisterEnter .42s ease-out both;
                }

                .nk-register-brand { text-align: center; margin-bottom: 24px; }

                .nk-register-logo {
                    width: 54px;
                    height: 54px;
                    display: grid;
                    place-items: center;
                    margin: 0 auto 13px;
                    border-radius: 16px;
                    background: linear-gradient(145deg, #4388f5, #2865d9);
                    color: #fff;
                    box-shadow: 0 9px 20px rgba(54,117,226,.22);
                    font-size: 25px;
                }

                .nk-register-brand h1 {
                    margin: 0;
                    color: #15152b;
                    font-size: 1.9rem;
                    line-height: 1.2;
                    font-weight: 750;
                    letter-spacing: -.75px;
                }

                .nk-register-brand p {
                    margin: 7px 0 0;
                    color: #777b8d;
                    font-size: .9rem;
                }

                .nk-register-card {
                    padding: 32px;
                    border: 1px solid #e8eaf1;
                    border-radius: 18px;
                    background: rgba(255,255,255,.96);
                    box-shadow: 0 18px 55px rgba(31,42,76,.08), 0 2px 8px rgba(31,42,76,.025);
                }

                .nk-register-card h2 {
                    margin: 0 0 8px;
                    color: #17172b;
                    font-size: 1.65rem;
                    line-height: 1.3;
                    font-weight: 720;
                    letter-spacing: -.45px;
                }

                .nk-register-description {
                    margin: 0 0 25px;
                    color: #777b8d;
                    font-size: .92rem;
                    line-height: 1.6;
                }

                .nk-register-field { margin-bottom: 17px; }

                .nk-register-field label {
                    display: block;
                    margin-bottom: 8px;
                    color: #34364b;
                    font-size: .86rem;
                    font-weight: 650;
                }

                .nk-register-field input {
                    display: block;
                    width: 100%;
                    min-height: 48px;
                    padding: 12px 14px;
                    border: 1px solid #dfe3ec;
                    border-radius: 9px;
                    outline: none;
                    background: #fff;
                    color: #17172b;
                    font: inherit;
                    font-size: .93rem;
                    box-shadow: 0 1px 2px rgba(20,30,60,.02);
                    transition: border-color .18s ease, box-shadow .18s ease, background .18s ease;
                }

                .nk-register-field input::placeholder { color: #a0a4b2; }

                .nk-register-field input:hover { border-color: #c4ccdc; }

                .nk-register-field input:focus {
                    border-color: #4388f5;
                    box-shadow: 0 0 0 3px rgba(67,136,245,.13);
                    background: #fff;
                }

                .nk-legal-box {
                    display: flex;
                    align-items: flex-start;
                    gap: 11px;
                    margin: 10px 0;
                    padding: 13px 14px;
                    border: 1px solid #e9ebf2;
                    border-radius: 10px;
                    background: #fafbfe;
                    transition: border-color .18s ease, background .18s ease;
                }

                .nk-legal-box:focus-within {
                    border-color: #9bbdf8;
                    background: #f7faff;
                }

                .nk-legal-checkbox {
                    width: 17px;
                    height: 17px;
                    flex: 0 0 17px;
                    margin: 3px 0 0;
                    accent-color: #3478e5;
                    cursor: pointer;
                }

                .nk-legal-copy {
                    color: #555a70;
                    font-size: .83rem;
                    line-height: 1.65;
                    cursor: pointer;
                }

                .nk-legal-copy a {
                    color: #276bd6;
                    font-weight: 650;
                    text-decoration: none;
                    text-underline-offset: 3px;
                }

                .nk-legal-copy a:hover { color: #174ca5; text-decoration: underline; }

                .nk-legal-help {
                    display: block;
                    margin-top: 4px;
                    color: #9296a5;
                    font-size: .77rem;
                    line-height: 1.5;
                }

                .nk-register-error,
                .nk-register-success {
                    margin: 16px 0;
                    padding: 12px 14px;
                    border-radius: 9px;
                    font-size: .86rem;
                    line-height: 1.5;
                }

                .nk-register-error {
                    color: #b42332;
                    border: 1px solid #f4cbd0;
                    background: #fff5f6;
                }

                .nk-register-success {
                    color: #167447;
                    border: 1px solid #c7eed8;
                    background: #f0fbf5;
                }

                .nk-register-button {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 10px;
                    width: 100%;
                    min-height: 49px;
                    margin-top: 22px;
                    padding: 12px 16px;
                    border: 0;
                    border-radius: 9px;
                    background: #101126;
                    color: #fff;
                    font: inherit;
                    font-size: .94rem;
                    font-weight: 700;
                    cursor: pointer;
                    box-shadow: 0 5px 12px rgba(18,20,48,.12);
                    transition: transform .18s ease, background .18s ease, box-shadow .18s ease;
                }

                .nk-register-button:hover:not(:disabled) {
                    background: #286bd8;
                    box-shadow: 0 8px 18px rgba(40,107,216,.2);
                    transform: translateY(-1px);
                }

                .nk-register-button:active:not(:disabled) { transform: translateY(0); }

                .nk-register-button:disabled { opacity: .7; cursor: wait; }

                .nk-register-spinner {
                    width: 16px;
                    height: 16px;
                    border: 2px solid rgba(255,255,255,.4);
                    border-top-color: #fff;
                    border-radius: 50%;
                    animation: nkRegisterSpin .7s linear infinite;
                }

                .nk-register-login {
                    margin-top: 22px;
                    color: #777b8d;
                    text-align: center;
                    font-size: .89rem;
                }

                .nk-register-login button {
                    padding: 0;
                    border: 0;
                    background: none;
                    color: #276bd6;
                    font: inherit;
                    font-weight: 700;
                    cursor: pointer;
                }

                .nk-register-login button:hover { color: #174ca5; text-decoration: underline; }

                .nk-register-info {
                    margin-top: 22px;
                    color: #85899a;
                    text-align: center;
                    font-size: .79rem;
                    line-height: 1.7;
                }

                .nk-register-info strong { color: #4b5065; }

                .nk-register-footer {
                    margin-top: 20px;
                    padding-top: 17px;
                    border-top: 1px solid #eceef4;
                    text-align: center;
                    color: #8b8fa0;
                    font-size: .78rem;
                    line-height: 1.8;
                }

                .nk-register-footer a {
                    color: #73788d;
                    text-decoration: none;
                    transition: color .18s ease;
                }

                .nk-register-footer a:hover { color: #276bd6; }
                .nk-register-footer span { margin: 0 7px; color: #c3c7d2; }

                @keyframes nkRegisterEnter {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                @keyframes nkRegisterSpin { to { transform: rotate(360deg); } }

                @media (max-width: 520px) {
                    .nk-register-page { padding: 25px 13px; align-items: flex-start; }
                    .nk-register-container { margin: auto 0; }
                    .nk-register-card { padding: 24px 19px; border-radius: 15px; }
                    .nk-register-brand h1 { font-size: 1.75rem; }
                    .nk-register-card h2 { font-size: 1.48rem; }
                    .nk-legal-copy { font-size: .81rem; }
                }

                @media (prefers-reduced-motion: reduce) {
                    .nk-register-container { animation: none; }
                    .nk-register-button, .nk-legal-box, .nk-register-field input { transition: none; }
                    .nk-register-spinner { animation-duration: 1.5s; }
                }
`}</style>

            <div className="nk-register-container">

                {/* BRAND */}

                <header className="nk-register-brand">
                    <div
                        className="nk-register-logo"
                        aria-hidden="true"
                    >
                        🏨
                    </div>

                    <h1>Net Kitonga</h1>

                    <p>Hotspot Supply Co.</p>
                </header>

                {/* REGISTRATION CARD */}

                <section
                    className="nk-register-card"
                    aria-labelledby="nk-register-title"
                >
                    <h2 id="nk-register-title">
                        Create Account
                    </h2>

                    <p className="nk-register-description">
                        Join our platform and start managing your supplies.
                    </p>

                    <form onSubmit={registerUser}>

                        {/* BUSINESS NAME */}

                        <div className="nk-register-field">
                            <label htmlFor="businessName">
                                Business Name
                            </label>

                            <input
                                id="businessName"
                                name="businessName"
                                type="text"
                                placeholder="Your business name"
                                value={businessName}
                                onChange={(event) =>
                                    setBusinessName(event.target.value)
                                }
                                autoComplete="organization"
                                required
                            />
                        </div>

                        {/* SYSTEM NAME */}

                        <div className="nk-register-field">
                            <label htmlFor="systemName">
                                System Name
                            </label>

                            <input
                                id="systemName"
                                name="systemName"
                                type="text"
                                placeholder="System identifier"
                                value={systemName}
                                onChange={(event) =>
                                    setSystemName(event.target.value)
                                }
                                required
                            />
                        </div>

                        {/* EMAIL */}

                        <div className="nk-register-field">
                            <label htmlFor="email">
                                Email Address
                            </label>

                            <input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(event) =>
                                    setEmail(event.target.value)
                                }
                                autoComplete="email"
                                required
                            />
                        </div>

                        {/* PASSWORD */}

                        <div className="nk-register-field">
                            <label htmlFor="password">
                                Password
                            </label>

                            <input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="Enter a secure password"
                                value={password}
                                onChange={(event) =>
                                    setPassword(event.target.value)
                                }
                                autoComplete="new-password"
                                required
                            />
                        </div>

                        {/* PHONE NUMBER */}

                        <div className="nk-register-field">
                            <label htmlFor="phoneNumber">
                                Phone Number (for support)
                            </label>

                            <input
                                id="phoneNumber"
                                name="phoneNumber"
                                type="tel"
                                placeholder="e.g. 0712345678"
                                value={phoneNumber}
                                onChange={(event) =>
                                    setPhoneNumber(event.target.value)
                                }
                                autoComplete="tel"
                            />
                        </div>

                        {/* PRIVACY POLICY ACCEPTANCE */}

                        <div className="nk-legal-box">
                            <input
                                className="nk-legal-checkbox"
                                id="acceptedPrivacy"
                                name="acceptedPrivacy"
                                type="checkbox"
                                checked={acceptedPrivacy}
                                onChange={(event) => {
                                    setAcceptedPrivacy(event.target.checked);
                                    setError("");
                                }}
                                required
                            />

                            <label
                                className="nk-legal-copy"
                                htmlFor="acceptedPrivacy"
                            >
                                I have read and agree to the{" "}

                                <a
                                    href="/privacy-policy"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Privacy Policy
                                </a>.

                                <span className="nk-legal-help">
                                    Learn how we collect, use, and protect
                                    your information.
                                </span>
                            </label>
                        </div>

                        {/* TERMS AND CONDITIONS ACCEPTANCE */}

                        <div className="nk-legal-box">
                            <input
                                className="nk-legal-checkbox"
                                id="acceptedTerms"
                                name="acceptedTerms"
                                type="checkbox"
                                checked={acceptedTerms}
                                onChange={(event) => {
                                    setAcceptedTerms(event.target.checked);
                                    setError("");
                                }}
                                required
                            />

                            <label
                                className="nk-legal-copy"
                                htmlFor="acceptedTerms"
                            >
                                I have read and agree to the{" "}

                                <a
                                    href="/terms-and-conditions"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Terms & Conditions
                                </a>.

                                <span className="nk-legal-help">
                                    Review the rules and responsibilities
                                    for using NetKitonga.
                                </span>
                            </label>
                        </div>

                        {/* REFUND POLICY ACCEPTANCE */}

                        <div className="nk-legal-box">
                            <input
                                className="nk-legal-checkbox"
                                id="acceptedRefund"
                                name="acceptedRefund"
                                type="checkbox"
                                checked={acceptedRefund}
                                onChange={(event) => {
                                    setAcceptedRefund(event.target.checked);
                                    setError("");
                                }}
                                required
                            />

                            <label
                                className="nk-legal-copy"
                                htmlFor="acceptedRefund"
                            >
                                I have read and agree to the{" "}

                                <a
                                    href="/refund-policy"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Refund Policy
                                </a>.

                                <span className="nk-legal-help">
                                    Understand how payments and refunds
                                    are handled on NetKitonga.
                                </span>
                            </label>
                        </div>

                        {/* ERROR MESSAGE */}

                        {error && (
                            <div
                                className="nk-register-error"
                                role="alert"
                            >
                                ⚠️ {error}
                            </div>
                        )}

                        {/* SUCCESS MESSAGE */}

                        {registered && (
                            <div
                                className="nk-register-success"
                                role="status"
                            >
                                ✓ Account created successfully!
                                Redirecting to sign in…
                            </div>
                        )}

                        {/* SUBMIT */}

                        <button
                            type="submit"
                            className="nk-register-button"
                            disabled={loading || registered}
                        >
                            {loading ? (
                                <>
                                    <span
                                        className="nk-register-spinner"
                                        aria-hidden="true"
                                    />

                                    Creating Account...
                                </>
                            ) : (
                                "Create Account"
                            )}
                        </button>
                    </form>

                    {/* SIGN IN LINK */}

                    <div className="nk-register-login">
                        Already have an account?{" "}

                        <button
                            type="button"
                            onClick={() => navigate("/")}
                        >
                            Sign In
                        </button>
                    </div>

                    {/* BRAND DESCRIPTION */}

                    <div className="nk-register-info">
                        <strong>Net Kitonga</strong> — Your trusted
                        partner in hotspot supply. Connecting businesses
                        with premium quality essentials.
                    </div>

                    {/* LEGAL FOOTER */}

                    <footer className="nk-register-footer">
                        <a href="/privacy-policy">
                            Privacy Policy
                        </a>

                        <span>·</span>

                        <a href="/terms-and-conditions">
                            Terms & Conditions
                        </a>

                        <span>·</span>

                        <a href="/refund-policy">
                            Refund Policy
                        </a>

                        <p>
                            © {new Date().getFullYear()} NetKitonga.
                            All rights reserved.
                        </p>
                    </footer>

                </section>
            </div>
        </main>
    );
}

export default Register;