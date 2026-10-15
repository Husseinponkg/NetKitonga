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
                .nk-register-page * {
                    box-sizing: border-box;
                }

                .nk-register-page {
                    min-height: 100vh;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    padding: 32px 16px;

                    background:
                        radial-gradient(
                            ellipse at top,
                            rgba(229, 9, 20, 0.10),
                            transparent 45%
                        ),
                        linear-gradient(
                            135deg,
                            #0b0b0d 0%,
                            #171719 55%,
                            #101012 100%
                        );

                    color: #f5f5f5;
                    font-family:
                        Inter,
                        "Segoe UI",
                        system-ui,
                        -apple-system,
                        sans-serif;
                }

                .nk-register-container {
                    width: 100%;
                    max-width: 460px;
                    animation: nkRegisterFadeIn .45s ease-out;
                }

                /* BRAND */

                .nk-register-brand {
                    text-align: center;
                    margin-bottom: 26px;
                }

                .nk-register-logo {
                    width: 58px;
                    height: 58px;
                    display: grid;
                    place-items: center;
                    margin: 0 auto 12px;
                    border-radius: 17px;

                    background: linear-gradient(
                        135deg,
                        #ed1c24,
                        #a80710
                    );

                    box-shadow: 0 10px 28px rgba(229, 9, 20, .25);
                    font-size: 27px;
                }

                .nk-register-brand h1 {
                    margin: 0;
                    font-size: 2rem;
                    line-height: 1.2;
                    font-weight: 750;
                    letter-spacing: -.7px;
                    color: #fff;
                }

                .nk-register-brand p {
                    margin: 7px 0 0;
                    color: #a7a7ad;
                    font-size: .9rem;
                }

                /* REGISTER CARD */

                .nk-register-card {
                    padding: 30px;
                    border: 1px solid rgba(255,255,255,.10);
                    border-radius: 16px;
                    background: rgba(24,24,27,.96);
                    box-shadow: 0 22px 65px rgba(0,0,0,.35);
                }

                .nk-register-card h2 {
                    margin: 0 0 8px;
                    font-size: 1.65rem;
                    line-height: 1.3;
                    font-weight: 700;
                    color: #fff;
                }

                .nk-register-description {
                    margin: 0 0 25px;
                    color: #a7a7ad;
                    font-size: .92rem;
                    line-height: 1.55;
                }

                /* FORM FIELDS */

                .nk-register-field {
                    margin-bottom: 17px;
                }

                .nk-register-field label {
                    display: block;
                    margin-bottom: 8px;
                    color: #e5e5e7;
                    font-size: .87rem;
                    font-weight: 600;
                }

                .nk-register-field input {
                    display: block;
                    width: 100%;
                    min-height: 47px;
                    padding: 12px 14px;
                    border: 1px solid #3b3b40;
                    border-radius: 8px;
                    outline: none;
                    background: #202024;
                    color: #fff;
                    font: inherit;
                    font-size: .94rem;

                    transition:
                        border-color .18s ease,
                        box-shadow .18s ease;
                }

                .nk-register-field input::placeholder {
                    color: #77777f;
                }

                .nk-register-field input:focus {
                    border-color: #e50914;
                    box-shadow: 0 0 0 3px rgba(229,9,20,.14);
                }

                /* LEGAL ACCEPTANCE */

                .nk-legal-box {
                    display: flex;
                    align-items: flex-start;
                    gap: 11px;
                    margin: 10px 0;
                    padding: 14px;

                    border: 1px solid rgba(255,255,255,.12);
                    border-radius: 9px;
                    background: rgba(255,255,255,.035);

                    transition:
                        border-color .2s ease,
                        background .2s ease;
                }

                .nk-legal-box:focus-within {
                    border-color: rgba(229,9,20,.65);
                    background: rgba(229,9,20,.045);
                }

                .nk-legal-checkbox {
                    width: 17px;
                    height: 17px;
                    flex: 0 0 17px;
                    margin: 3px 0 0;
                    accent-color: #e50914;
                    cursor: pointer;
                }

                .nk-legal-copy {
                    color: #d2d2d6;
                    font-size: .86rem;
                    line-height: 1.65;
                    cursor: pointer;
                }

                .nk-legal-copy a {
                    color: #fff;
                    font-weight: 650;
                    text-decoration: underline;
                    text-decoration-color: #e50914;
                    text-underline-offset: 3px;
                    transition: color .18s ease;
                }

                .nk-legal-copy a:hover {
                    color: #ff7379;
                }

                .nk-legal-help {
                    display: block;
                    margin-top: 5px;
                    color: #9999a2;
                    font-size: .78rem;
                    line-height: 1.5;
                }

                /* ERROR AND SUCCESS */

                .nk-register-error,
                .nk-register-success {
                    margin: 16px 0;
                    padding: 11px 13px;
                    border-radius: 8px;
                    font-size: .86rem;
                    line-height: 1.5;
                }

                .nk-register-error {
                    color: #ffb8bb;
                    border: 1px solid rgba(255,89,97,.3);
                    background: rgba(229,9,20,.10);
                }

                .nk-register-success {
                    color: #a7f3c0;
                    border: 1px solid rgba(74,222,128,.25);
                    background: rgba(34,197,94,.09);
                }

                /* SUBMIT BUTTON */

                .nk-register-button {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 10px;
                    width: 100%;
                    min-height: 48px;
                    margin-top: 22px;
                    padding: 12px 16px;
                    border: 0;
                    border-radius: 8px;

                    background: linear-gradient(
                        135deg,
                        #e50914,
                        #b80710
                    );

                    color: #fff;
                    font: inherit;
                    font-size: .96rem;
                    font-weight: 700;
                    cursor: pointer;

                    transition:
                        transform .18s ease,
                        filter .18s ease;
                }

                .nk-register-button:hover:not(:disabled) {
                    filter: brightness(1.12);
                    transform: translateY(-1px);
                }

                .nk-register-button:disabled {
                    opacity: .72;
                    cursor: wait;
                }

                .nk-register-spinner {
                    width: 16px;
                    height: 16px;
                    border: 2px solid rgba(255,255,255,.4);
                    border-top-color: #fff;
                    border-radius: 50%;
                    animation: nkRegisterSpin .7s linear infinite;
                }

                /* SIGN IN */

                .nk-register-login {
                    margin-top: 22px;
                    color: #a7a7ad;
                    text-align: center;
                    font-size: .9rem;
                }

                .nk-register-login button {
                    padding: 0;
                    border: 0;
                    background: none;
                    color: #fff;
                    font: inherit;
                    font-weight: 650;
                    cursor: pointer;
                    text-decoration: underline;
                    text-decoration-color: #e50914;
                    text-underline-offset: 3px;
                }

                .nk-register-login button:hover {
                    color: #ff7379;
                }

                .nk-register-info {
                    margin-top: 22px;
                    color: #85858d;
                    text-align: center;
                    font-size: .79rem;
                    line-height: 1.7;
                }

                .nk-register-info strong {
                    color: #c8c8ce;
                }

                .nk-register-footer {
                    margin-top: 20px;
                    padding-top: 17px;
                    border-top: 1px solid rgba(255,255,255,.08);
                    text-align: center;
                    color: #85858d;
                    font-size: .78rem;
                    line-height: 1.8;
                }

                .nk-register-footer a {
                    color: #b9b9c0;
                    text-decoration: none;
                    transition: color .18s ease;
                }

                .nk-register-footer a:hover {
                    color: #ff7379;
                }

                .nk-register-footer span {
                    margin: 0 7px;
                    color: #55555c;
                }

                @keyframes nkRegisterFadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(12px);
                    }

                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes nkRegisterSpin {
                    to {
                        transform: rotate(360deg);
                    }
                }

                @media (max-width: 480px) {
                    .nk-register-page {
                        padding: 22px 12px;
                        align-items: flex-start;
                    }

                    .nk-register-container {
                        margin: auto 0;
                    }

                    .nk-register-card {
                        padding: 23px 19px;
                    }

                    .nk-register-brand h1 {
                        font-size: 1.8rem;
                    }

                    .nk-register-card h2 {
                        font-size: 1.5rem;
                    }

                    .nk-legal-copy {
                        font-size: .82rem;
                    }
                }

                @media (prefers-reduced-motion: reduce) {
                    .nk-register-container {
                        animation: none;
                    }

                    .nk-register-button,
                    .nk-legal-box {
                        transition: none;
                    }

                    .nk-register-spinner {
                        animation-duration: 1.5s;
                    }
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