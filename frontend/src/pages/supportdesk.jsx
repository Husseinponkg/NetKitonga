import React from "react";

const contacts = [
    {
        title: "CTO",
        department: "Technical Support",
        description:
            "For technical issues, system errors, integrations and infrastructure support.",
        email: "dbacrisskarengi@outlook.com",
        phone: "0757830276",
        icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`
    },
    {
        title: "Customer Support",
        department: "Customer Experience",
        description:
            "For account assistance, payments, packages and general enquiries.",
        email: "husseinpatrick34@gmail.com",
        phone: "0792476367",
        icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
    },
];

export default function SupportDesk() {
    return (
        <main className="support-desk">
            <style>{`
                .support-desk {
                    width: 100%;
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: clamp(16px, 3vw, 32px);
                    color: #f5f5f5;
                    box-sizing: border-box;
                    font-family: inherit;
                }

                .support-desk *,
                .support-desk *::before,
                .support-desk *::after {
                    box-sizing: border-box;
                }

                .support-hero {
                    margin-bottom: 32px;
                }

                .support-eyebrow {
                    display: inline-block;
                    margin-bottom: 12px;
                    color: #e50914;
                    font-size: 11px;
                    font-weight: 800;
                    letter-spacing: 2px;
                }

                .support-hero h1 {
                    margin: 0 0 12px;
                    color: #ffffff;
                    font-size: clamp(28px, 4vw, 42px);
                    line-height: 1.2;
                    letter-spacing: -1px;
                    overflow-wrap: anywhere;
                }

                .support-hero p {
                    max-width: 620px;
                    margin: 0;
                    color: #a1a1aa;
                    font-size: 14px;
                    line-height: 1.8;
                }

                .support-contact-grid {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 22px;
                    width: 100%;
                }

                .support-contact-card {
                    min-width: 0;
                    padding: clamp(18px, 3vw, 28px);
                    background: #141414;
                    border: 1px solid #292929;
                    border-radius: 14px;
                    transition: border-color 0.2s ease,
                                transform 0.2s ease;
                }

                .support-contact-card:hover {
                    border-color: rgba(229, 9, 20, 0.65);
                    transform: translateY(-3px);
                }

                .support-contact-icon {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 50px;
                    height: 50px;
                    margin-bottom: 22px;
                    background: rgba(229, 9, 20, 0.12);
                    border: 1px solid rgba(229, 9, 20, 0.25);
                    border-radius: 12px;
                    color: #ff424b;
                    font-size: 25px;
                }

                .support-department {
                    color: #ff424b;
                    font-size: 11px;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }

                .support-contact-card h2 {
                    margin: 10px 0;
                    color: #ffffff;
                    font-size: clamp(20px, 2.5vw, 25px);
                    line-height: 1.35;
                    overflow-wrap: anywhere;
                }

                .support-description {
                    min-height: 48px;
                    margin: 0 0 24px;
                    color: #a1a1aa;
                    font-size: 13px;
                    line-height: 1.8;
                }

                .support-contact-details {
                    display: flex;
                    flex-direction: column;
                    gap: 18px;
                    min-width: 0;
                    padding: 20px 0;
                    border-top: 1px solid #292929;
                    border-bottom: 1px solid #292929;
                }

                .support-detail {
                    display: flex;
                    flex-direction: column;
                    gap: 7px;
                    min-width: 0;
                }

                .support-detail-label {
                    color: #71717a;
                    font-size: 12px;
                }

                .support-detail a {
                    width: fit-content;
                    max-width: 100%;
                    color: #f4f4f5;
                    font-size: 13px;
                    text-decoration: none;
                    overflow-wrap: anywhere;
                    word-break: break-word;
                }

                .support-detail a:hover {
                    color: #ff424b;
                }

                .support-actions {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                    margin-top: 24px;
                }

                .support-btn {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    flex: 1 1 120px;
                    min-width: 0;
                    min-height: 46px;
                    padding: 10px 14px;
                    border-radius: 7px;
                    font-size: 13px;
                    font-weight: 700;
                    text-align: center;
                    text-decoration: none;
                    transition: background 0.2s ease,
                                border-color 0.2s ease;
                }

                .support-btn-primary {
                    color: #ffffff;
                    background: #e50914;
                    border: 1px solid #e50914;
                }

                .support-btn-primary:hover {
                    background: #bd0610;
                    border-color: #bd0610;
                }

                .support-btn-secondary {
                    color: #f4f4f5;
                    background: #202020;
                    border: 1px solid #383838;
                }

                .support-btn-secondary:hover {
                    background: #292929;
                    border-color: #555555;
                }

                .support-footer {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-top: 30px;
                    color: #71717a;
                    font-size: 12px;
                    line-height: 1.7;
                }

                .support-footer p {
                    margin: 0;
                }

                .support-status-dot {
                    width: 8px;
                    height: 8px;
                    flex-shrink: 0;
                    background: #22c55e;
                    border-radius: 50%;
                }

                @media (max-width: 900px) {
                    .support-contact-grid {
                        gap: 16px;
                    }

                    .support-actions {
                        flex-direction: column;
                    }

                    .support-btn {
                        width: 100%;
                        flex: auto;
                    }
                }

                @media (max-width: 600px) {
                    .support-desk {
                        padding: 20px 12px;
                    }

                    .support-hero {
                        margin-bottom: 24px;
                    }

                    .support-hero h1 {
                        font-size: 29px;
                    }

                    .support-hero p {
                        font-size: 13px;
                    }

                    .support-contact-grid {
                        grid-template-columns: minmax(0, 1fr);
                        gap: 16px;
                    }

                    .support-contact-card {
                        padding: 20px 16px;
                        border-radius: 12px;
                    }

                    .support-contact-icon {
                        width: 44px;
                        height: 44px;
                        margin-bottom: 17px;
                    }

                    .support-contact-card h2 {
                        font-size: 21px;
                    }

                    .support-description {
                        min-height: 0;
                        margin-bottom: 20px;
                    }

                    .support-contact-details {
                        gap: 16px;
                        padding: 18px 0;
                    }

                    .support-detail a {
                        font-size: 12px;
                    }

                    .support-actions {
                        margin-top: 20px;
                    }

                    .support-btn {
                        min-height: 46px;
                    }
                }

                @media (max-width: 360px) {
                    .support-desk {
                        padding: 16px 8px;
                    }

                    .support-contact-card {
                        padding: 16px 12px;
                    }

                    .support-hero h1 {
                        font-size: 25px;
                    }

                    .support-detail a {
                        font-size: 11px;
                    }
                }

                @media (prefers-reduced-motion: reduce) {
                    .support-contact-card,
                    .support-btn {
                        transition: none;
                    }
                }
            `}</style>

            <header className="support-hero">
                <span className="support-eyebrow">
                    NETKITONGA HELP CENTER
                </span>

                <h1>Support Desk</h1>

                <p>
                    Need assistance? Our team is ready to help with
                    technical issues, account questions and general
                    enquiries.
                </p>
            </header>

            <section className="support-contact-grid">
                {contacts.map((contact) => (
                    <article
                        className="support-contact-card"
                        key={contact.email}
                    >
                        <div
                            className="support-contact-icon"
                            aria-hidden="true"
                        >
                            <span dangerouslySetInnerHTML={{ __html: contact.icon }} />
                        </div>

                        <span className="support-department">
                            {contact.department}
                        </span>

                        <h2>{contact.title}</h2>

                        <p className="support-description">
                            {contact.description}
                        </p>

                        <div className="support-contact-details">
                            <div className="support-detail">
                                <span className="support-detail-label">
                                    Email address
                                </span>

                                <a href={`mailto:${contact.email}`}>
                                    {contact.email}
                                </a>
                            </div>

                            <div className="support-detail">
                                <span className="support-detail-label">
                                    Phone number
                                </span>

                                <a href={`tel:${contact.phone}`}>
                                    {contact.phone}
                                </a>
                            </div>
                        </div>

                        <div className="support-actions">
                            <a
                                href={`mailto:${contact.email}`}
                                className="support-btn support-btn-primary"
                            >
                                Send Email
                            </a>

                            <a
                                href={`tel:${contact.phone}`}
                                className="support-btn support-btn-secondary"
                            >
                                Call Now
                            </a>
                        </div>
                    </article>
                ))}
            </section>

            <footer className="support-footer">
                <span className="support-status-dot"></span>

                <p>
                    NetKitonga Support Desk · Here to help.
                </p>
            </footer>
        </main>
    );
}
