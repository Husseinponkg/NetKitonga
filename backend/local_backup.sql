--
-- PostgreSQL database dump
--

\restrict P1voOOICHyD7o1mqE1oCIn62Mv7djLLVgSNQTs7ZrbMMDjNVEzpWgYfT7lzoHjF

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: active_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.active_sessions (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    router_id integer NOT NULL,
    buyer_id integer NOT NULL,
    payment_id integer NOT NULL,
    session_id character varying(150) NOT NULL,
    assigned_ip character varying(45) NOT NULL,
    bytes_uploaded bigint DEFAULT 0,
    bytes_downloaded bigint DEFAULT 0,
    start_time timestamp without time zone NOT NULL,
    expiration_time timestamp without time zone NOT NULL,
    status character varying(30) DEFAULT 'active'::character varying
);


ALTER TABLE public.active_sessions OWNER TO postgres;

--
-- Name: active_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.active_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.active_sessions_id_seq OWNER TO postgres;

--
-- Name: active_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.active_sessions_id_seq OWNED BY public.active_sessions.id;


--
-- Name: admins; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admins (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(150) NOT NULL,
    password_hash character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.admins OWNER TO postgres;

--
-- Name: admins_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.admins_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.admins_id_seq OWNER TO postgres;

--
-- Name: admins_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.admins_id_seq OWNED BY public.admins.id;


--
-- Name: branches; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.branches (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    branch_name character varying(100) NOT NULL,
    branch_location character varying(255) NOT NULL,
    branch_email character varying(150) NOT NULL,
    branch_phone character varying(20) NOT NULL,
    branch_manager character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.branches OWNER TO postgres;

--
-- Name: branches_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.branches_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.branches_id_seq OWNER TO postgres;

--
-- Name: branches_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.branches_id_seq OWNED BY public.branches.id;


--
-- Name: buyers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.buyers (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    buyer_mac character varying(50) NOT NULL,
    phone_number character varying(30),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.buyers OWNER TO postgres;

--
-- Name: buyers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.buyers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.buyers_id_seq OWNER TO postgres;

--
-- Name: buyers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.buyers_id_seq OWNED BY public.buyers.id;


--
-- Name: packages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.packages (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    package_name character varying(100) NOT NULL,
    price numeric(10,2) NOT NULL,
    duration_seconds integer NOT NULL,
    data_quota_bytes bigint DEFAULT 0,
    mikrotik_rate_limit character varying(50),
    wifidog_max_down_bandwidth integer,
    wifidog_max_up_bandwidth integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    description character varying(100),
    status character varying(20) DEFAULT 'active'::character varying
);


ALTER TABLE public.packages OWNER TO postgres;

--
-- Name: packages_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.packages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.packages_id_seq OWNER TO postgres;

--
-- Name: packages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.packages_id_seq OWNED BY public.packages.id;


--
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    branch_id integer NOT NULL,
    router_id integer NOT NULL,
    package_id integer NOT NULL,
    buyer_id integer NOT NULL,
    amount numeric(10,2) NOT NULL,
    payment_gateway character varying(50) NOT NULL,
    gateway_reference character varying(150) NOT NULL,
    status character varying(30) DEFAULT 'pending'::character varying,
    auth_token character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.payments OWNER TO postgres;

--
-- Name: payments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payments_id_seq OWNER TO postgres;

--
-- Name: payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payments_id_seq OWNED BY public.payments.id;


--
-- Name: routers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.routers (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    branch_id integer NOT NULL,
    router_name character varying(100) NOT NULL,
    driver_type character varying(50) NOT NULL,
    nas_identifier character varying(100),
    radius_secret character varying(100),
    gw_id character varying(100),
    mac_address character varying(50) NOT NULL,
    is_licensed boolean DEFAULT true,
    status character varying(20) DEFAULT 'offline'::character varying,
    last_heartbeat_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.routers OWNER TO postgres;

--
-- Name: routers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.routers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.routers_id_seq OWNER TO postgres;

--
-- Name: routers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.routers_id_seq OWNED BY public.routers.id;


--
-- Name: tenant_wallets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tenant_wallets (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    total_earned numeric(12,2) DEFAULT 0.00,
    total_withdrawn numeric(12,2) DEFAULT 0.00,
    current_balance numeric(12,2) DEFAULT 0.00,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.tenant_wallets OWNER TO postgres;

--
-- Name: tenant_wallets_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tenant_wallets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tenant_wallets_id_seq OWNER TO postgres;

--
-- Name: tenant_wallets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tenant_wallets_id_seq OWNED BY public.tenant_wallets.id;


--
-- Name: tenants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tenants (
    id integer NOT NULL,
    business_name character varying(150) NOT NULL,
    system_name character varying(100) DEFAULT 'My Hotspot Billing'::character varying,
    email character varying(150) NOT NULL,
    password_hash character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.tenants OWNER TO postgres;

--
-- Name: tenants_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tenants_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tenants_id_seq OWNER TO postgres;

--
-- Name: tenants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tenants_id_seq OWNED BY public.tenants.id;


--
-- Name: withdrawals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.withdrawals (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    wallet_id integer NOT NULL,
    amount numeric(10,2) NOT NULL,
    mobile_money_number character varying(30) NOT NULL,
    payout_provider character varying(50) NOT NULL,
    transaction_reference character varying(150),
    status character varying(30) DEFAULT 'pending'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.withdrawals OWNER TO postgres;

--
-- Name: withdrawals_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.withdrawals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.withdrawals_id_seq OWNER TO postgres;

--
-- Name: withdrawals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.withdrawals_id_seq OWNED BY public.withdrawals.id;


--
-- Name: active_sessions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.active_sessions ALTER COLUMN id SET DEFAULT nextval('public.active_sessions_id_seq'::regclass);


--
-- Name: admins id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins ALTER COLUMN id SET DEFAULT nextval('public.admins_id_seq'::regclass);


--
-- Name: branches id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branches ALTER COLUMN id SET DEFAULT nextval('public.branches_id_seq'::regclass);


--
-- Name: buyers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.buyers ALTER COLUMN id SET DEFAULT nextval('public.buyers_id_seq'::regclass);


--
-- Name: packages id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.packages ALTER COLUMN id SET DEFAULT nextval('public.packages_id_seq'::regclass);


--
-- Name: payments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments ALTER COLUMN id SET DEFAULT nextval('public.payments_id_seq'::regclass);


--
-- Name: routers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.routers ALTER COLUMN id SET DEFAULT nextval('public.routers_id_seq'::regclass);


--
-- Name: tenant_wallets id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenant_wallets ALTER COLUMN id SET DEFAULT nextval('public.tenant_wallets_id_seq'::regclass);


--
-- Name: tenants id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenants ALTER COLUMN id SET DEFAULT nextval('public.tenants_id_seq'::regclass);


--
-- Name: withdrawals id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.withdrawals ALTER COLUMN id SET DEFAULT nextval('public.withdrawals_id_seq'::regclass);


--
-- Data for Name: active_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.active_sessions (id, tenant_id, router_id, buyer_id, payment_id, session_id, assigned_ip, bytes_uploaded, bytes_downloaded, start_time, expiration_time, status) FROM stdin;
\.


--
-- Data for Name: admins; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admins (id, name, email, password_hash, created_at) FROM stdin;
\.


--
-- Data for Name: branches; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.branches (id, tenant_id, branch_name, branch_location, branch_email, branch_phone, branch_manager, created_at) FROM stdin;
1	1	black	namanga	obumehussein8@gmail.com	0674839393	mimi	2026-09-01 19:57:18.977835
3	1	black	namanga	obumehussein@gmail.com	0674839393	mimi	2026-09-01 19:57:35.690282
5	1	black	namanga	obumehussfein@gmail.com	0674839393	mimi	2026-09-01 20:04:43.74039
6	1	sas	sdsd	obumehusse@gmail.com	45454546	dfsf	2026-09-01 20:09:39.508077
8	2	Hussein	Obume	obumehussein6@gmail.com	0718153570	mimi	2026-09-01 20:56:17.118464
9	5	wandelTech	Arusha	obumehussein890@gmail.com	0618153570	hussein	2026-09-02 18:35:22.938629
\.


--
-- Data for Name: buyers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.buyers (id, tenant_id, buyer_mac, phone_number, created_at) FROM stdin;
\.


--
-- Data for Name: packages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.packages (id, tenant_id, package_name, price, duration_seconds, data_quota_bytes, mikrotik_rate_limit, wifidog_max_down_bandwidth, wifidog_max_up_bandwidth, created_at, description, status) FROM stdin;
1	7	noma kwa jero	200.00	14400	0	5M/2M	5242880	2097152	2026-09-03 08:56:50.545038	hii ni yetu tena	active
2	7	siku nzima	1000.00	86400	0	5M/2M	5242880	2097152	2026-09-04 06:46:55.214988	unlimited 24/7	active
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payments (id, tenant_id, branch_id, router_id, package_id, buyer_id, amount, payment_gateway, gateway_reference, status, auth_token, created_at) FROM stdin;
\.


--
-- Data for Name: routers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.routers (id, tenant_id, branch_id, router_name, driver_type, nas_identifier, radius_secret, gw_id, mac_address, is_licensed, status, last_heartbeat_at, created_at) FROM stdin;
4	5	1	Pnampa	mikrotik_radius	NAS_MIKROTIK_ID_18	A002#tz1	\N	08:00:27:A8:32:AD	t	online	2026-09-02 17:58:33.889136	2026-09-02 18:18:41.14031
\.


--
-- Data for Name: tenant_wallets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tenant_wallets (id, tenant_id, total_earned, total_withdrawn, current_balance, updated_at) FROM stdin;
\.


--
-- Data for Name: tenants; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tenants (id, business_name, system_name, email, password_hash, created_at) FROM stdin;
1	hjskdkd	pdppddf	obumehussein8@gmail.com	$2b$12$w2.01v/OlfmiX2Ii5BgoFehOhHDBF2SP28Paiyz.vFCn8bE9Sfqcq	2026-09-01 19:52:10.031505
2	mii	compton	obumehussein@gmail.com	$2b$12$j4Fw9wxAixCzp7NDfUPT0uGlRO7IE1q7vBvknogJfxMzaQT4ghUe6	2026-09-01 20:52:27.181448
3	mwijaku networks	Noma	obumehussein10@gmail.com	$2b$12$tZ/KP1yWHXXDvu0/Hbpfe.4ZaLvEUAeDfExijX1lFOxecWCc.Hvc.	2026-09-02 14:34:19.362959
4	fgg	dgf	obumehussein82@gmail.com	$2b$12$vcyVg7lOC9rH3C6vjU0aieSSnu0ZzjksMpuL.z/98n10a9EWaUkS2	2026-09-02 17:27:38.246022
5	bussiness	nms	obumehussein862@gmail.com	$2b$12$FPJS/nsPNUmtwaU9JfAn8Oh9dcoGNxGRii55BwuSD7TJuxUFB9KUe	2026-09-02 17:39:08.353279
6	black	firstdegree	obumehussein2@gmail.com	$2b$12$KtgZ2/whlWqcG.L6ZQorAOxPs6rgodGjkU.9RpVWzR3h1ZamH/Wkm	2026-09-02 18:42:17.119511
7	Mama amina Wifi	wifi	obumehussein8r@gmail.com	$2b$12$DNycGtK8IS0VlxIHDOZSI.7ExwLC5HZMs/Y8H7YjBgcgrXJAez3bi	2026-09-03 07:27:06.285231
8	Wasafi NetKItonga	shamlago	obumehussein86@gmail.com	$2b$12$EgEDqCTJ7JbJNhA8ZfId6..tZF7q1KNBmfImElxYqkIoztsMemu66	2026-09-04 07:22:49.083233
\.


--
-- Data for Name: withdrawals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.withdrawals (id, tenant_id, wallet_id, amount, mobile_money_number, payout_provider, transaction_reference, status, created_at) FROM stdin;
\.


--
-- Name: active_sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.active_sessions_id_seq', 1, false);


--
-- Name: admins_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.admins_id_seq', 1, false);


--
-- Name: branches_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.branches_id_seq', 9, true);


--
-- Name: buyers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.buyers_id_seq', 1, false);


--
-- Name: packages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.packages_id_seq', 2, true);


--
-- Name: payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payments_id_seq', 1, false);


--
-- Name: routers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.routers_id_seq', 4, true);


--
-- Name: tenant_wallets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tenant_wallets_id_seq', 1, false);


--
-- Name: tenants_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tenants_id_seq', 8, true);


--
-- Name: withdrawals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.withdrawals_id_seq', 1, false);


--
-- Name: active_sessions active_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.active_sessions
    ADD CONSTRAINT active_sessions_pkey PRIMARY KEY (id);


--
-- Name: active_sessions active_sessions_session_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.active_sessions
    ADD CONSTRAINT active_sessions_session_id_key UNIQUE (session_id);


--
-- Name: admins admins_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_email_key UNIQUE (email);


--
-- Name: admins admins_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_pkey PRIMARY KEY (id);


--
-- Name: branches branches_branch_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_branch_email_key UNIQUE (branch_email);


--
-- Name: branches branches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_pkey PRIMARY KEY (id);


--
-- Name: buyers buyers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.buyers
    ADD CONSTRAINT buyers_pkey PRIMARY KEY (id);


--
-- Name: buyers buyers_tenant_id_buyer_mac_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.buyers
    ADD CONSTRAINT buyers_tenant_id_buyer_mac_key UNIQUE (tenant_id, buyer_mac);


--
-- Name: packages packages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.packages
    ADD CONSTRAINT packages_pkey PRIMARY KEY (id);


--
-- Name: payments payments_auth_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_auth_token_key UNIQUE (auth_token);


--
-- Name: payments payments_gateway_reference_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_gateway_reference_key UNIQUE (gateway_reference);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: routers routers_gw_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.routers
    ADD CONSTRAINT routers_gw_id_key UNIQUE (gw_id);


--
-- Name: routers routers_mac_address_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.routers
    ADD CONSTRAINT routers_mac_address_key UNIQUE (mac_address);


--
-- Name: routers routers_nas_identifier_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.routers
    ADD CONSTRAINT routers_nas_identifier_key UNIQUE (nas_identifier);


--
-- Name: routers routers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.routers
    ADD CONSTRAINT routers_pkey PRIMARY KEY (id);


--
-- Name: tenant_wallets tenant_wallets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenant_wallets
    ADD CONSTRAINT tenant_wallets_pkey PRIMARY KEY (id);


--
-- Name: tenant_wallets tenant_wallets_tenant_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenant_wallets
    ADD CONSTRAINT tenant_wallets_tenant_id_key UNIQUE (tenant_id);


--
-- Name: tenants tenants_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_email_key UNIQUE (email);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- Name: withdrawals withdrawals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.withdrawals
    ADD CONSTRAINT withdrawals_pkey PRIMARY KEY (id);


--
-- Name: idx_packages_tenant_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_packages_tenant_status ON public.packages USING btree (tenant_id, status);


--
-- Name: active_sessions active_sessions_buyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.active_sessions
    ADD CONSTRAINT active_sessions_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.buyers(id) ON DELETE CASCADE;


--
-- Name: active_sessions active_sessions_payment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.active_sessions
    ADD CONSTRAINT active_sessions_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.payments(id) ON DELETE CASCADE;


--
-- Name: active_sessions active_sessions_router_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.active_sessions
    ADD CONSTRAINT active_sessions_router_id_fkey FOREIGN KEY (router_id) REFERENCES public.routers(id) ON DELETE CASCADE;


--
-- Name: active_sessions active_sessions_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.active_sessions
    ADD CONSTRAINT active_sessions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: branches branches_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: buyers buyers_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.buyers
    ADD CONSTRAINT buyers_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: packages packages_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.packages
    ADD CONSTRAINT packages_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: payments payments_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;


--
-- Name: payments payments_buyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.buyers(id) ON DELETE CASCADE;


--
-- Name: payments payments_package_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_package_id_fkey FOREIGN KEY (package_id) REFERENCES public.packages(id) ON DELETE CASCADE;


--
-- Name: payments payments_router_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_router_id_fkey FOREIGN KEY (router_id) REFERENCES public.routers(id) ON DELETE CASCADE;


--
-- Name: payments payments_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: routers routers_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.routers
    ADD CONSTRAINT routers_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;


--
-- Name: routers routers_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.routers
    ADD CONSTRAINT routers_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: tenant_wallets tenant_wallets_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenant_wallets
    ADD CONSTRAINT tenant_wallets_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: withdrawals withdrawals_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.withdrawals
    ADD CONSTRAINT withdrawals_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: withdrawals withdrawals_wallet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.withdrawals
    ADD CONSTRAINT withdrawals_wallet_id_fkey FOREIGN KEY (wallet_id) REFERENCES public.tenant_wallets(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict P1voOOICHyD7o1mqE1oCIn62Mv7djLLVgSNQTs7ZrbMMDjNVEzpWgYfT7lzoHjF

