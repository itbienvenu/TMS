--
-- PostgreSQL database dump
--

\restrict NS72JeKaecdjtArQ83bzigQHDwasUxVE5aJgg8o9hus1pSJVMfVBDCyvstpzkdz

-- Dumped from database version 16.11 (Ubuntu 16.11-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.11 (Ubuntu 16.11-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: itbienvenu
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO itbienvenu;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: itbienvenu
--

COMMENT ON SCHEMA public IS '';


--
-- Name: paymentstatus; Type: TYPE; Schema: public; Owner: itbienvenu
--

CREATE TYPE public.paymentstatus AS ENUM (
    'pending',
    'success',
    'failed'
);


ALTER TYPE public.paymentstatus OWNER TO itbienvenu;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: itbienvenu
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);


ALTER TABLE public.alembic_version OWNER TO itbienvenu;

--
-- Name: bus_routes; Type: TABLE; Schema: public; Owner: itbienvenu
--

CREATE TABLE public.bus_routes (
    bus_id character varying NOT NULL,
    route_id character varying NOT NULL
);


ALTER TABLE public.bus_routes OWNER TO itbienvenu;

--
-- Name: bus_schedules; Type: TABLE; Schema: public; Owner: itbienvenu
--

CREATE TABLE public.bus_schedules (
    bus_id character varying NOT NULL,
    schedule_id character varying NOT NULL
);


ALTER TABLE public.bus_schedules OWNER TO itbienvenu;

--
-- Name: bus_stations; Type: TABLE; Schema: public; Owner: itbienvenu
--

CREATE TABLE public.bus_stations (
    id character varying NOT NULL,
    name character varying NOT NULL,
    location character varying,
    company_id character varying,
    created_at timestamp without time zone
);


ALTER TABLE public.bus_stations OWNER TO itbienvenu;

--
-- Name: buses; Type: TABLE; Schema: public; Owner: itbienvenu
--

CREATE TABLE public.buses (
    id character varying NOT NULL,
    plate_number character varying NOT NULL,
    capacity integer NOT NULL,
    available_seats integer NOT NULL,
    created_at timestamp without time zone,
    company_id character varying
);


ALTER TABLE public.buses OWNER TO itbienvenu;

--
-- Name: companies; Type: TABLE; Schema: public; Owner: itbienvenu
--

CREATE TABLE public.companies (
    id character varying NOT NULL,
    name character varying NOT NULL,
    email character varying,
    phone_number character varying,
    address character varying,
    created_at timestamp without time zone
);


ALTER TABLE public.companies OWNER TO itbienvenu;

--
-- Name: company_user_extra_permissions; Type: TABLE; Schema: public; Owner: itbienvenu
--

CREATE TABLE public.company_user_extra_permissions (
    company_user_id character varying NOT NULL,
    permission_id character varying NOT NULL
);


ALTER TABLE public.company_user_extra_permissions OWNER TO itbienvenu;

--
-- Name: company_user_revoked_permissions; Type: TABLE; Schema: public; Owner: itbienvenu
--

CREATE TABLE public.company_user_revoked_permissions (
    company_user_id character varying NOT NULL,
    permission_id character varying NOT NULL
);


ALTER TABLE public.company_user_revoked_permissions OWNER TO itbienvenu;

--
-- Name: company_user_roles; Type: TABLE; Schema: public; Owner: itbienvenu
--

CREATE TABLE public.company_user_roles (
    company_user_id character varying NOT NULL,
    role_id character varying NOT NULL
);


ALTER TABLE public.company_user_roles OWNER TO itbienvenu;

--
-- Name: company_users; Type: TABLE; Schema: public; Owner: itbienvenu
--

CREATE TABLE public.company_users (
    id character varying NOT NULL,
    full_name character varying NOT NULL,
    email character varying,
    login_email character varying,
    phone_number character varying,
    password_hash character varying NOT NULL,
    created_at timestamp without time zone,
    company_id character varying NOT NULL
);


ALTER TABLE public.company_users OWNER TO itbienvenu;

--
-- Name: login_otps; Type: TABLE; Schema: public; Owner: itbienvenu
--

CREATE TABLE public.login_otps (
    id character varying NOT NULL,
    code character varying NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    consumed boolean,
    company_user_id character varying NOT NULL
);


ALTER TABLE public.login_otps OWNER TO itbienvenu;

--
-- Name: payments; Type: TABLE; Schema: public; Owner: itbienvenu
--

CREATE TABLE public.payments (
    id character varying NOT NULL,
    ticket_id character varying NOT NULL,
    user_id character varying,
    phone_number character varying(20) NOT NULL,
    amount double precision NOT NULL,
    provider character varying(50) NOT NULL,
    status public.paymentstatus,
    created_at timestamp without time zone
);


ALTER TABLE public.payments OWNER TO itbienvenu;

--
-- Name: permissions; Type: TABLE; Schema: public; Owner: itbienvenu
--

CREATE TABLE public.permissions (
    id character varying NOT NULL,
    name character varying NOT NULL,
    company_id character varying
);


ALTER TABLE public.permissions OWNER TO itbienvenu;

--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: itbienvenu
--

CREATE TABLE public.role_permissions (
    role_id character varying NOT NULL,
    permission_id character varying NOT NULL
);


ALTER TABLE public.role_permissions OWNER TO itbienvenu;

--
-- Name: roles; Type: TABLE; Schema: public; Owner: itbienvenu
--

CREATE TABLE public.roles (
    id character varying NOT NULL,
    name character varying NOT NULL,
    company_id character varying
);


ALTER TABLE public.roles OWNER TO itbienvenu;

--
-- Name: route_segments; Type: TABLE; Schema: public; Owner: itbienvenu
--

CREATE TABLE public.route_segments (
    id character varying NOT NULL,
    route_id character varying NOT NULL,
    start_station_id character varying NOT NULL,
    end_station_id character varying NOT NULL,
    price double precision NOT NULL,
    stop_order integer NOT NULL,
    company_id character varying
);


ALTER TABLE public.route_segments OWNER TO itbienvenu;

--
-- Name: routes; Type: TABLE; Schema: public; Owner: itbienvenu
--

CREATE TABLE public.routes (
    id character varying NOT NULL,
    origin_id character varying,
    destination_id character varying,
    price double precision NOT NULL,
    company_id character varying,
    created_at timestamp without time zone
);


ALTER TABLE public.routes OWNER TO itbienvenu;

--
-- Name: schedules; Type: TABLE; Schema: public; Owner: itbienvenu
--

CREATE TABLE public.schedules (
    id character varying NOT NULL,
    bus_id character varying,
    route_segment_id character varying,
    departure_time timestamp without time zone NOT NULL,
    arrival_time timestamp without time zone,
    company_id character varying
);


ALTER TABLE public.schedules OWNER TO itbienvenu;

--
-- Name: tickets; Type: TABLE; Schema: public; Owner: itbienvenu
--

CREATE TABLE public.tickets (
    id character varying NOT NULL,
    user_id character varying,
    bus_id character varying,
    schedule_id character varying,
    company_id character varying,
    route_id character varying,
    qr_code character varying NOT NULL,
    status character varying,
    mode character varying,
    created_at timestamp without time zone
);


ALTER TABLE public.tickets OWNER TO itbienvenu;

--
-- Name: users; Type: TABLE; Schema: public; Owner: itbienvenu
--

CREATE TABLE public.users (
    id character varying NOT NULL,
    full_name character varying NOT NULL,
    email character varying,
    phone_number character varying,
    password_hash character varying NOT NULL,
    created_at timestamp without time zone
);


ALTER TABLE public.users OWNER TO itbienvenu;

--
-- Data for Name: alembic_version; Type: TABLE DATA; Schema: public; Owner: itbienvenu
--

COPY public.alembic_version (version_num) FROM stdin;
16bd365092db
\.


--
-- Data for Name: bus_routes; Type: TABLE DATA; Schema: public; Owner: itbienvenu
--

COPY public.bus_routes (bus_id, route_id) FROM stdin;
bus-003	route-003
\.


--
-- Data for Name: bus_schedules; Type: TABLE DATA; Schema: public; Owner: itbienvenu
--

COPY public.bus_schedules (bus_id, schedule_id) FROM stdin;
\.


--
-- Data for Name: bus_stations; Type: TABLE DATA; Schema: public; Owner: itbienvenu
--

COPY public.bus_stations (id, name, location, company_id, created_at) FROM stdin;
station-001	Gare du Nord	Abidjan, Cocody	company-001	2025-12-06 16:48:46.908712
station-002	Gare du Sud	Abidjan, Yopougon	company-001	2025-12-06 16:48:46.908712
station-003	Gare Centrale	Abidjan, Plateau	company-001	2025-12-06 16:48:46.908712
station-004	Terminal Yopougon	Abidjan, Yopougon	company-002	2025-12-06 16:48:46.908712
station-005	Terminal Cocody	Abidjan, Cocody	company-002	2025-12-06 16:48:46.908712
f157e214-8a9c-43ec-b762-4d16f6c37ac9	CONGO-NIL	RUTSIRO	company-001	2025-12-06 16:48:40.530873
47bae8f9-6f59-43a6-9e50-ecdffd7efa2f	MUSHUBATI	RUTSIRO	company-001	2025-12-06 20:01:33.070947
891ebb4e-51c2-4953-94f5-08bd1a86cb50	MUSHUBATI	RUTSIRO	company-002	2025-12-07 00:12:46.186518
\.


--
-- Data for Name: buses; Type: TABLE DATA; Schema: public; Owner: itbienvenu
--

COPY public.buses (id, plate_number, capacity, available_seats, created_at, company_id) FROM stdin;
bus-003	IJ-789-KL	45	0	2025-12-06 16:48:47.955038	company-002
81e5d4bc-ce80-4d6a-b6d8-56db2475aee1	RAC222T	45	0	2025-12-06 16:51:50.219329	company-001
bus-001	RAD234P	50	1	2025-12-06 16:48:47.952614	company-001
\.


--
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: itbienvenu
--

COPY public.companies (id, name, email, phone_number, address, created_at) FROM stdin;
company-001	Express Bus Lines	info@expressbus.com	+225 07 12 34 56 78	Abidjan, Cocody	2025-12-06 16:48:47.027106
company-002	Comfort Travel	contact@comforttravel.com	+225 05 98 76 54 32	Abidjan, Yopougon	2025-12-06 16:48:47.103419
\.


--
-- Data for Name: company_user_extra_permissions; Type: TABLE DATA; Schema: public; Owner: itbienvenu
--

COPY public.company_user_extra_permissions (company_user_id, permission_id) FROM stdin;
\.


--
-- Data for Name: company_user_revoked_permissions; Type: TABLE DATA; Schema: public; Owner: itbienvenu
--

COPY public.company_user_revoked_permissions (company_user_id, permission_id) FROM stdin;
\.


--
-- Data for Name: company_user_roles; Type: TABLE DATA; Schema: public; Owner: itbienvenu
--

COPY public.company_user_roles (company_user_id, role_id) FROM stdin;
company-user-super-admin	role-super-admin
company-user-001	role-admin-001
company-user-002	role-admin-002
88c1af4a-9edd-4442-868b-6ce1a72a5a49	role-admin-001
95dd982e-3a55-4416-a095-f7847a43dcf3	ed90b1cb-e329-473e-b42e-03688300fffd
\.


--
-- Data for Name: company_users; Type: TABLE DATA; Schema: public; Owner: itbienvenu
--

COPY public.company_users (id, full_name, email, login_email, phone_number, password_hash, created_at, company_id) FROM stdin;
company-user-super-admin	Super Admin	superadmin@ticketing.com	admin@ticketing.com	+225 01 00 00 00 00	$2b$12$X2Oii5J/dM9pdyMuh0079ubZgC/aw8l/FJr/Pa/.n.Jwpk7i.p9hu	2025-12-06 16:48:47.612189	company-001
company-user-001	Alice Manager	alice@expressbus.com	admin@expressbus.com	+225 07 12 34 56 79	$2b$12$X2Oii5J/dM9pdyMuh0079ubZgC/aw8l/FJr/Pa/.n.Jwpk7i.p9hu	2025-12-06 16:48:47.877553	company-001
company-user-002	Bob Director	bob@comforttravel.com	admin@comforttravel.com	+225 05 98 76 54 33	$2b$12$X2Oii5J/dM9pdyMuh0079ubZgC/aw8l/FJr/Pa/.n.Jwpk7i.p9hu	2025-12-06 16:48:47.880081	company-002
88c1af4a-9edd-4442-868b-6ce1a72a5a49	GASHEMAMWIMULE	gashemabienvenu@gmail.com	gashema@express.com		$2b$12$AUxpnXMpVsmduSUwL8UOEe7KVndecfRzfym6sbibEjA6EEYg.Tg/a	2025-12-06 21:09:03.300625	company-001
95dd982e-3a55-4416-a095-f7847a43dcf3	MUNEZERO ONE	munezero@gmail.com	munezero@virunga.com		$2b$12$tRO.cFZWEUy41b0/jP2lSO.KsclK8XN6KjuNOkK6oBhsFmaqMHTSW	2025-12-07 00:03:31.393753	company-001
\.


--
-- Data for Name: login_otps; Type: TABLE DATA; Schema: public; Owner: itbienvenu
--

COPY public.login_otps (id, code, expires_at, consumed, company_user_id) FROM stdin;
80d1455e-1222-4785-b83b-ab92005566f5	969981	2025-12-06 21:39:32.617101	t	company-user-001
0e47a53d-735c-4d59-a6b0-30e07d6c5246	314479	2025-12-07 00:11:51.259996	t	company-user-001
ed6b59fc-6a88-4ef7-a0c2-2c0dc23aadd1	354017	2025-12-07 00:15:48.048216	t	company-user-001
c7469323-f0e7-4421-a2a5-f7fb567b889d	098706	2025-12-07 00:27:41.886176	t	company-user-002
36bc35a6-9dac-4822-ab26-664d009810e9	832685	2025-12-06 17:01:21.763289	t	company-user-001
a73f4f3f-af0b-4cdd-a4b7-dce83389460a	509262	2025-12-06 17:07:26.388296	t	company-user-001
7a7982fd-29d1-4c76-883d-e4d15824f472	021253	2025-12-06 17:15:20.91736	t	company-user-001
da679a1a-7dec-4024-bede-51cc3763397c	407721	2025-12-06 17:19:36.43349	f	company-user-001
280ae724-eac7-4d6e-9a6d-ddd2cc915d1a	676206	2025-12-06 17:20:37.195501	t	company-user-001
e4f7a135-65ec-4449-b0af-5e02e149aaf5	144804	2025-12-06 17:54:31.998935	t	company-user-001
2a3feb15-4c5a-4bef-9d57-49b5a015784a	004460	2025-12-06 18:16:34.055218	t	company-user-001
be0de4a0-f022-4821-8b65-00feecf31286	355181	2025-12-06 19:36:20.976466	t	company-user-001
55afb742-fa40-477b-bfbf-b89032368aa1	789074	2025-12-06 19:52:09.839204	t	company-user-001
e7826bc4-ec34-42a6-9418-8de5bb73206c	269972	2025-12-06 20:10:16.188456	t	company-user-001
d6c9e254-e9ac-4ac6-be04-6b1f1968c784	613949	2025-12-06 20:12:45.618943	t	company-user-001
73e2583a-05cb-4d6b-9b8e-f11e69c023ca	242298	2025-12-06 20:34:23.322592	t	company-user-001
0466dcab-2edc-4835-b5a5-435f9792cb91	668352	2025-12-06 20:45:03.654174	t	company-user-001
1fa3fcd4-7075-43b0-8b9e-5fc83048697b	461893	2025-12-06 20:54:49.182514	t	company-user-001
cce95c99-c567-4bcb-b320-199dff5304e3	286947	2025-12-06 21:01:13.978815	t	company-user-001
1ec9f97b-7abe-4817-968e-2f8f3c48cf6b	418540	2025-12-06 21:16:38.879975	t	company-user-001
cad1ca00-06b7-478f-8d82-7c54454400b8	442526	2025-12-06 21:20:50.384051	t	company-user-001
11b6dbd8-bb54-4fda-abf1-6b30487c38b7	406132	2025-12-06 21:26:00.916423	t	company-user-001
71a16288-3d20-4018-8c44-b0324e3d8ca5	085212	2025-12-06 21:29:05.296536	t	company-user-001
82f17573-d075-47d5-bc10-1e795ca5eb94	141232	2025-12-06 21:32:43.076949	t	company-user-001
5f6f47d9-adda-468f-aa0e-b12cf6cdaede	098955	2025-12-06 21:35:50.685998	t	company-user-001
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: itbienvenu
--

COPY public.payments (id, ticket_id, user_id, phone_number, amount, provider, status, created_at) FROM stdin;
payment-001	ticket-002	user-002	+225 07 55 66 77 88	1500	momo	success	2025-12-06 16:48:48.070969
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: itbienvenu
--

COPY public.permissions (id, name, company_id) FROM stdin;
696f98f1-430a-462b-a810-b22f54fad497	create_user	\N
6516d275-8053-4909-945f-95072286a395	view_user	\N
4a19375c-b6a5-4025-8150-7ac7f4abf8b4	update_user	\N
fc1b8115-ea4a-42b9-ad92-fe8e74042b4a	delete_user	\N
3549f256-c0a7-4b6a-b7c7-dd29af5aeb59	view_ticket	\N
88e41c2c-1af2-4084-bc02-9fe4376dca9d	update_ticket	\N
56cf73f5-c0b5-4a67-b719-f4481b9f9c89	delete_ticket	\N
21f21eea-a334-4793-8f61-68a1b12c494b	create_payment	\N
86d3ba3c-4622-40b8-ad3f-6c879c186b42	view_payment	\N
59bf3bbd-5f74-4e2c-844e-da0c020e3a6b	update_payment	\N
e1b67670-a0cc-4aad-acd8-a861ee52db1c	delete_payment	\N
bac6d055-27db-451e-9598-a41998099439	create_role	\N
f7d245b6-20c6-4383-bc6c-ee558d38e9fd	view_role	\N
28f45dc9-c20a-430a-ac59-251234c91cbc	update_role	\N
eb0c8ff7-d208-4afb-a914-989090b5f819	delete_role	\N
838ca9f5-8dec-4d4e-8117-1a1ea4d23c23	assign_role	\N
1b836d28-3a4a-4318-b339-70ac25cb6e22	access_dashboard	\N
42c7337b-e0de-4da8-9f82-a731d11a2e93	manage_permissions	\N
e9d9702a-864e-4a5c-a3c8-d12cea6adb43	create_permission	\N
41b9c441-56c6-4dd5-a895-e9e236fc900e	assign_permission	\N
91c05ac9-128d-4b34-ae87-53195993779f	get_permission	\N
7b77033b-da6b-4e23-8fde-ee5db856877f	delete_permission	\N
c1f01aa5-e5da-4b58-953b-2d26648276bf	view_users	\N
244422cb-62b0-4699-8b8d-8984dd338116	list_all_roles	\N
64c67587-db9d-411b-93ce-84ca6e4b72f7	create_route	\N
d6b4cf86-aa78-463f-820b-92d4c82209b8	update_route	\N
fc98764c-c410-43da-aba9-66626f75cb5c	delete_route	\N
62f90a53-0629-4c99-9c28-8a6e74559d5d	assign_bus_route	\N
4c356884-8053-456a-8046-17b2034fdfd3	delete_db	\N
972974b8-16f0-4a82-84c2-0f2950c8e9d1	create_ticket	\N
c0b6259e-bb1c-4744-8c46-0ae419431214	see_all_tickets	\N
4b040bc2-03c4-43fc-913c-ba6677658042	delete_bus	\N
9b380122-710c-463b-8b10-f4fd983e0dfc	create_user	company-001
147d9e08-b3fc-45c1-8e07-34db74cb273b	view_user	company-001
9834dedd-cc41-43c4-a6d7-710b66ef2a7e	update_user	company-001
3bd81f82-04ef-4dda-9383-80cdffc0641b	delete_user	company-001
539ef1ec-15d2-454e-b93f-95cc24b2ad32	view_ticket	company-001
67f3126a-47d9-4821-b11b-a149ee951c8a	update_ticket	company-001
569ff5ae-e82a-4984-ba4d-c3ac2e65689a	delete_ticket	company-001
c328584d-93d0-4cac-baeb-f6255f6158b7	create_payment	company-001
c1d67223-f5e2-4351-ad08-a5969d5b1c36	view_payment	company-001
94cd346f-be17-4933-86dc-e6229148a894	update_payment	company-001
cd806d49-0303-48d0-8f15-3dcd2910e755	delete_payment	company-001
e72c40ec-a345-456a-a738-373ef1b6b0ae	create_role	company-001
135d456b-6ee5-4690-bcbc-41fddc5b0e6b	view_role	company-001
96765d56-e28b-41b8-880c-4b663d68333f	update_role	company-001
0aedcdff-9935-4d96-ae93-ee4bd58f09d1	delete_role	company-001
5d201866-72f5-4ab1-ad70-6ed5a9a5da5d	assign_role	company-001
a7e35969-3547-421b-8aa6-a63b404c61c0	access_dashboard	company-001
eb861cc9-218f-478d-a11c-2a8bc819fe0a	manage_permissions	company-001
a1e5a547-bc57-4160-95bf-7c689d29b2c2	create_permission	company-001
3017deec-4952-4045-b2bc-77dd3596d5bf	assign_permission	company-001
ff22a45c-443a-462a-87d4-27fc5c2c88b7	get_permission	company-001
abba339a-c462-4593-ab58-620b23552438	delete_permission	company-001
d6c85db7-29cc-4f63-aec8-1d37f051808e	view_users	company-001
ebeac698-9843-4492-ae0e-7ca7484f0a82	list_all_roles	company-001
b577435b-ca64-4c7e-b05d-1994942b1e20	create_route	company-001
67393f0a-b062-4ab8-a388-9978a6163ba2	update_route	company-001
54a04a6c-fe4a-42ee-8331-a72b8f20661a	delete_route	company-001
1fb50f7c-4a31-41f3-90d2-01b53529afdf	assign_bus_route	company-001
e799e305-fde9-4c7f-b22f-58925d0daf26	delete_db	company-001
1493fed1-d578-438c-b43b-f556ac8a3f99	create_ticket	company-001
64840547-10ae-4239-823d-907d492ef2a9	see_all_tickets	company-001
2a34f3a5-cd78-49cf-89f1-7d79159355ab	delete_bus	company-001
65427cc4-2ba3-47b2-ac6c-458557c85405	create_user	company-002
d9ca9f45-b785-4889-90c2-8c0b1c0ad7d0	view_user	company-002
fa8b8e37-bb74-4c67-bd68-ea520fb35f57	update_user	company-002
50d2a637-e881-4d74-ba1b-c8f25982b35d	delete_user	company-002
e0e0e887-ed38-43e1-aa59-fa921d088f7c	view_ticket	company-002
f7d0faa2-29a0-4ef1-aa26-8b886e624a06	update_ticket	company-002
a34e8b58-40f4-4e23-a8d9-91d33276135e	delete_ticket	company-002
9141e79e-6211-4342-9698-50ea44a88d4c	create_payment	company-002
3c643ef3-68cf-4a23-8e51-89ae64cfebdf	view_payment	company-002
29c68d8a-94fb-47b1-ba42-535366f464f2	update_payment	company-002
9018191e-c234-467b-935e-c6a856b7bec2	delete_payment	company-002
92bb11e8-f54d-4a80-b569-3b159b7cb1f9	create_role	company-002
9213c301-aae0-4195-bf3d-74b2397b3801	view_role	company-002
0369b594-8762-423c-b56b-f34575afa5a1	update_role	company-002
6e202199-5aa4-44f6-be53-370b92be6f25	delete_role	company-002
b776eeb4-99ab-448f-8acf-76904f862231	assign_role	company-002
c81d9bfb-8dd8-4bad-ab99-8b88de026351	access_dashboard	company-002
9bb8672e-ac55-4b09-9f9b-eb24878c18a7	manage_permissions	company-002
225d1f1c-f71f-4028-b9fb-4ca1cf112c3a	create_permission	company-002
4ee654e9-a352-4212-ac9e-90e320759283	assign_permission	company-002
07805cdb-8427-436c-a764-79c031eefdf6	get_permission	company-002
ae0ea804-04bb-40e0-add0-9b1d6eada3a6	delete_permission	company-002
bc5746c0-3951-4e4e-8879-a9552c327338	view_users	company-002
f6b7b4b1-4373-43a6-a7b8-4311a381e4e7	list_all_roles	company-002
f97900fe-6ba5-41b3-8a0c-980017045fd3	create_route	company-002
cf8502c3-e82e-4840-8353-fcf4c5f1d776	update_route	company-002
a0c1031d-9957-4444-aea6-da64c1b86c4d	delete_route	company-002
31847783-2d8e-4da8-a182-6af243a2c3de	assign_bus_route	company-002
d45d8359-e366-4bb0-aafb-3b385cd643d9	delete_db	company-002
e8280f94-515e-4ffb-bedc-e74b8352420e	create_ticket	company-002
5f91532c-c425-4d53-81e8-c2f1487817b9	see_all_tickets	company-002
b602398b-c8f8-4190-a743-0a60d1a46e69	delete_bus	company-002
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: itbienvenu
--

COPY public.role_permissions (role_id, permission_id) FROM stdin;
role-super-admin	e9d9702a-864e-4a5c-a3c8-d12cea6adb43
role-super-admin	c1f01aa5-e5da-4b58-953b-2d26648276bf
role-super-admin	42c7337b-e0de-4da8-9f82-a731d11a2e93
role-super-admin	1b836d28-3a4a-4318-b339-70ac25cb6e22
role-super-admin	838ca9f5-8dec-4d4e-8117-1a1ea4d23c23
role-super-admin	eb0c8ff7-d208-4afb-a914-989090b5f819
role-super-admin	28f45dc9-c20a-430a-ac59-251234c91cbc
role-super-admin	f7d245b6-20c6-4383-bc6c-ee558d38e9fd
role-super-admin	bac6d055-27db-451e-9598-a41998099439
role-super-admin	e1b67670-a0cc-4aad-acd8-a861ee52db1c
role-super-admin	59bf3bbd-5f74-4e2c-844e-da0c020e3a6b
role-super-admin	86d3ba3c-4622-40b8-ad3f-6c879c186b42
role-super-admin	21f21eea-a334-4793-8f61-68a1b12c494b
role-super-admin	56cf73f5-c0b5-4a67-b719-f4481b9f9c89
role-super-admin	88e41c2c-1af2-4084-bc02-9fe4376dca9d
role-super-admin	3549f256-c0a7-4b6a-b7c7-dd29af5aeb59
role-super-admin	fc1b8115-ea4a-42b9-ad92-fe8e74042b4a
role-super-admin	4b040bc2-03c4-43fc-913c-ba6677658042
role-super-admin	4a19375c-b6a5-4025-8150-7ac7f4abf8b4
role-super-admin	7b77033b-da6b-4e23-8fde-ee5db856877f
role-super-admin	6516d275-8053-4909-945f-95072286a395
role-super-admin	696f98f1-430a-462b-a810-b22f54fad497
role-super-admin	64c67587-db9d-411b-93ce-84ca6e4b72f7
role-super-admin	244422cb-62b0-4699-8b8d-8984dd338116
role-super-admin	d6b4cf86-aa78-463f-820b-92d4c82209b8
role-super-admin	fc98764c-c410-43da-aba9-66626f75cb5c
role-super-admin	62f90a53-0629-4c99-9c28-8a6e74559d5d
role-super-admin	91c05ac9-128d-4b34-ae87-53195993779f
role-super-admin	4c356884-8053-456a-8046-17b2034fdfd3
role-super-admin	972974b8-16f0-4a82-84c2-0f2950c8e9d1
role-super-admin	41b9c441-56c6-4dd5-a895-e9e236fc900e
role-super-admin	c0b6259e-bb1c-4744-8c46-0ae419431214
role-admin-002	b776eeb4-99ab-448f-8acf-76904f862231
role-admin-002	c81d9bfb-8dd8-4bad-ab99-8b88de026351
role-admin-002	9bb8672e-ac55-4b09-9f9b-eb24878c18a7
role-admin-002	225d1f1c-f71f-4028-b9fb-4ca1cf112c3a
role-admin-002	31847783-2d8e-4da8-a182-6af243a2c3de
role-admin-002	4ee654e9-a352-4212-ac9e-90e320759283
role-admin-002	65427cc4-2ba3-47b2-ac6c-458557c85405
role-admin-002	07805cdb-8427-436c-a764-79c031eefdf6
role-admin-002	d9ca9f45-b785-4889-90c2-8c0b1c0ad7d0
role-admin-002	ae0ea804-04bb-40e0-add0-9b1d6eada3a6
role-admin-002	fa8b8e37-bb74-4c67-bd68-ea520fb35f57
role-admin-002	bc5746c0-3951-4e4e-8879-a9552c327338
role-admin-002	f6b7b4b1-4373-43a6-a7b8-4311a381e4e7
role-admin-002	50d2a637-e881-4d74-ba1b-c8f25982b35d
role-admin-002	f97900fe-6ba5-41b3-8a0c-980017045fd3
role-admin-002	cf8502c3-e82e-4840-8353-fcf4c5f1d776
role-admin-002	e0e0e887-ed38-43e1-aa59-fa921d088f7c
role-admin-002	a0c1031d-9957-4444-aea6-da64c1b86c4d
role-admin-002	f7d0faa2-29a0-4ef1-aa26-8b886e624a06
role-admin-002	a34e8b58-40f4-4e23-a8d9-91d33276135e
role-admin-002	d45d8359-e366-4bb0-aafb-3b385cd643d9
role-admin-002	9141e79e-6211-4342-9698-50ea44a88d4c
role-admin-002	e8280f94-515e-4ffb-bedc-e74b8352420e
role-admin-002	3c643ef3-68cf-4a23-8e51-89ae64cfebdf
role-admin-002	5f91532c-c425-4d53-81e8-c2f1487817b9
role-admin-002	29c68d8a-94fb-47b1-ba42-535366f464f2
role-admin-002	b602398b-c8f8-4190-a743-0a60d1a46e69
role-admin-002	9018191e-c234-467b-935e-c6a856b7bec2
role-admin-002	92bb11e8-f54d-4a80-b569-3b159b7cb1f9
role-admin-002	9213c301-aae0-4195-bf3d-74b2397b3801
role-admin-002	0369b594-8762-423c-b56b-f34575afa5a1
role-admin-002	6e202199-5aa4-44f6-be53-370b92be6f25
role-admin-001	9b380122-710c-463b-8b10-f4fd983e0dfc
role-admin-001	147d9e08-b3fc-45c1-8e07-34db74cb273b
role-admin-001	9834dedd-cc41-43c4-a6d7-710b66ef2a7e
role-admin-001	3bd81f82-04ef-4dda-9383-80cdffc0641b
role-admin-001	539ef1ec-15d2-454e-b93f-95cc24b2ad32
role-admin-001	67f3126a-47d9-4821-b11b-a149ee951c8a
role-admin-001	569ff5ae-e82a-4984-ba4d-c3ac2e65689a
role-admin-001	c328584d-93d0-4cac-baeb-f6255f6158b7
role-admin-001	c1d67223-f5e2-4351-ad08-a5969d5b1c36
role-admin-001	94cd346f-be17-4933-86dc-e6229148a894
role-admin-001	cd806d49-0303-48d0-8f15-3dcd2910e755
role-admin-001	e72c40ec-a345-456a-a738-373ef1b6b0ae
role-admin-001	135d456b-6ee5-4690-bcbc-41fddc5b0e6b
role-admin-001	96765d56-e28b-41b8-880c-4b663d68333f
role-admin-001	0aedcdff-9935-4d96-ae93-ee4bd58f09d1
role-admin-001	5d201866-72f5-4ab1-ad70-6ed5a9a5da5d
role-admin-001	a7e35969-3547-421b-8aa6-a63b404c61c0
role-admin-001	eb861cc9-218f-478d-a11c-2a8bc819fe0a
role-admin-001	a1e5a547-bc57-4160-95bf-7c689d29b2c2
role-admin-001	3017deec-4952-4045-b2bc-77dd3596d5bf
role-admin-001	ff22a45c-443a-462a-87d4-27fc5c2c88b7
role-admin-001	abba339a-c462-4593-ab58-620b23552438
role-admin-001	d6c85db7-29cc-4f63-aec8-1d37f051808e
role-admin-001	ebeac698-9843-4492-ae0e-7ca7484f0a82
role-admin-001	b577435b-ca64-4c7e-b05d-1994942b1e20
role-admin-001	67393f0a-b062-4ab8-a388-9978a6163ba2
role-admin-001	54a04a6c-fe4a-42ee-8331-a72b8f20661a
role-admin-001	1fb50f7c-4a31-41f3-90d2-01b53529afdf
role-admin-001	e799e305-fde9-4c7f-b22f-58925d0daf26
role-admin-001	1493fed1-d578-438c-b43b-f556ac8a3f99
role-admin-001	64840547-10ae-4239-823d-907d492ef2a9
role-admin-001	2a34f3a5-cd78-49cf-89f1-7d79159355ab
ed90b1cb-e329-473e-b42e-03688300fffd	9b380122-710c-463b-8b10-f4fd983e0dfc
ed90b1cb-e329-473e-b42e-03688300fffd	abba339a-c462-4593-ab58-620b23552438
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: itbienvenu
--

COPY public.roles (id, name, company_id) FROM stdin;
role-super-admin	super_admin	\N
role-admin-001	company_admin	company-001
role-admin-002	company_admin	company-002
ed90b1cb-e329-473e-b42e-03688300fffd	manager	company-001
\.


--
-- Data for Name: route_segments; Type: TABLE DATA; Schema: public; Owner: itbienvenu
--

COPY public.route_segments (id, route_id, start_station_id, end_station_id, price, stop_order, company_id) FROM stdin;
segment-001	route-001	station-001	station-002	2500	1	company-001
segment-002	route-002	station-001	station-003	1500	1	company-001
segment-003	route-003	station-004	station-005	2000	1	company-002
799023ca-19f9-4d7b-9c6d-5fdc85facf9c	371df4d2-6cd6-428b-ab4d-a82c6c8b2e1c	47bae8f9-6f59-43a6-9e50-ecdffd7efa2f	f157e214-8a9c-43ec-b762-4d16f6c37ac9	700	1	company-001
\.


--
-- Data for Name: routes; Type: TABLE DATA; Schema: public; Owner: itbienvenu
--

COPY public.routes (id, origin_id, destination_id, price, company_id, created_at) FROM stdin;
route-001	station-001	station-002	2500	company-001	2025-12-06 16:48:47.913595
route-002	station-001	station-003	1500	company-001	2025-12-06 16:48:47.913717
route-003	station-004	station-005	2000	company-002	2025-12-06 16:48:47.915374
371df4d2-6cd6-428b-ab4d-a82c6c8b2e1c	47bae8f9-6f59-43a6-9e50-ecdffd7efa2f	f157e214-8a9c-43ec-b762-4d16f6c37ac9	700	company-001	2025-12-06 20:01:33.073285
69e4b04f-7f5f-4800-8459-33e2b38e6df3	891ebb4e-51c2-4953-94f5-08bd1a86cb50	891ebb4e-51c2-4953-94f5-08bd1a86cb50	900	company-002	2025-12-07 00:12:46.188594
\.


--
-- Data for Name: schedules; Type: TABLE DATA; Schema: public; Owner: itbienvenu
--

COPY public.schedules (id, bus_id, route_segment_id, departure_time, arrival_time, company_id) FROM stdin;
schedule-004	bus-003	segment-003	2025-12-07 09:00:00	2025-12-07 10:30:00	company-002
6206f546-c7ea-4c5f-baf5-e05c96cf6f62	81e5d4bc-ce80-4d6a-b6d8-56db2475aee1	799023ca-19f9-4d7b-9c6d-5fdc85facf9c	2025-12-06 20:03:08.685701	\N	company-001
\.


--
-- Data for Name: tickets; Type: TABLE DATA; Schema: public; Owner: itbienvenu
--

COPY public.tickets (id, user_id, bus_id, schedule_id, company_id, route_id, qr_code, status, mode, created_at) FROM stdin;
ticket-001	user-001	bus-001	\N	company-001	route-001	dGlja2V0LTAwMS5kVHc5Piv96ELHNHzfQGHd0WxCZrvY40wph6E-4_WK6Q==	booked	active	2025-12-06 16:48:48.050007
ticket-002	user-002	\N	\N	company-001	route-002	dGlja2V0LTAwMi6_ZWVD4eEbl6anbFfJSvYw4T8gTjDfXBXZjkwOSzfaRA==	paid	active	2025-12-06 16:48:48.055946
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: itbienvenu
--

COPY public.users (id, full_name, email, phone_number, password_hash, created_at) FROM stdin;
user-001	John Doe	john.doe@example.com	+225 07 11 22 33 44	$2b$12$X2Oii5J/dM9pdyMuh0079ubZgC/aw8l/FJr/Pa/.n.Jwpk7i.p9hu	2025-12-06 16:48:47.581095
user-002	Jane Smith	jane.smith@example.com	+225 07 55 66 77 88	$2b$12$X2Oii5J/dM9pdyMuh0079ubZgC/aw8l/FJr/Pa/.n.Jwpk7i.p9hu	2025-12-06 16:48:47.581209
\.


--
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: public; Owner: itbienvenu
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- Name: bus_routes bus_routes_pkey; Type: CONSTRAINT; Schema: public; Owner: itbienvenu
--

ALTER TABLE ONLY public.bus_routes
    ADD CONSTRAINT bus_routes_pkey PRIMARY KEY (bus_id, route_id);


--
-- Name: bus_schedules bus_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: itbienvenu
--

ALTER TABLE ONLY public.bus_schedules
    ADD CONSTRAINT bus_schedules_pkey PRIMARY KEY (bus_id, schedule_id);


--
-- Name: bus_stations bus_stations_pkey; Type: CONSTRAINT; Schema: public; Owner: itbienvenu
--

ALTER TABLE ONLY public.bus_stations
    ADD CONSTRAINT bus_stations_pkey PRIMARY KEY (id);


--
-- Name: buses buses_pkey; Type: CONSTRAINT; Schema: public; Owner: itbienvenu
--

ALTER TABLE ONLY public.buses
    ADD CONSTRAINT buses_pkey PRIMARY KEY (id);


--
-- Name: buses buses_plate_number_key; Type: CONSTRAINT; Schema: public; Owner: itbienvenu
--

ALTER TABLE ONLY public.buses
    ADD CONSTRAINT buses_plate_number_key UNIQUE (plate_number);


--
-- Name: companies companies_email_key; Type: CONSTRAINT; Schema: public; Owner: itbienvenu
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_email_key UNIQUE (email);


--
-- Name: companies companies_name_key; Type: CONSTRAINT; Schema: public; Owner: itbienvenu
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_name_key UNIQUE (name);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: itbienvenu
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: company_user_extra_permissions company_user_extra_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: itbienvenu
--

ALTER TABLE ONLY public.company_user_extra_permissions
    ADD CONSTRAINT company_user_extra_permissions_pkey PRIMARY KEY (company_user_id, permission_id);


--
-- Name: company_user_revoked_permissions company_user_revoked_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: itbienvenu
--

ALTER TABLE ONLY public.company_user_revoked_permissions
    ADD CONSTRAINT company_user_revoked_permissions_pkey PRIMARY KEY (company_user_id, permission_id);


--
-- Name: company_user_roles company_user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: itbienvenu
--

ALTER TABLE ONLY public.company_user_roles
    ADD CONSTRAINT company_user_roles_pkey PRIMARY KEY (company_user_id, role_id);


--
-- Name: company_users company_users_email_key; Type: CONSTRAINT; Schema: public; Owner: itbienvenu
--

ALTER TABLE ONLY public.company_users
    ADD CONSTRAINT company_users_email_key UNIQUE (email);


--
-- Name: company_users company_users_login_email_key; Type: CONSTRAINT; Schema: public; Owner: itbienvenu
--

ALTER TABLE ONLY public.company_users
    ADD CONSTRAINT company_users_login_email_key UNIQUE (login_email);


--
-- Name: company_users company_users_pkey; Type: CONSTRAINT; Schema: public; Owner: itbienvenu
--

ALTER TABLE ONLY public.company_users
    ADD CONSTRAINT company_users_pkey PRIMARY KEY (id);


--
-- Name: login_otps login_otps_pkey; Type: CONSTRAINT; Schema: public; Owner: itbienvenu
--

ALTER TABLE ONLY public.login_otps
    ADD CONSTRAINT login_otps_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: itbienvenu
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: itbienvenu
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: itbienvenu
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, permission_id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: itbienvenu
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: route_segments route_segments_pkey; Type: CONSTRAINT; Schema: public; Owner: itbienvenu
--

ALTER TABLE ONLY public.route_segments
    ADD CONSTRAINT route_segments_pkey PRIMARY KEY (id);


--
-- Name: routes routes_pkey; Type: CONSTRAINT; Schema: public; Owner: itbienvenu
--

ALTER TABLE ONLY public.routes
    ADD CONSTRAINT routes_pkey PRIMARY KEY (id);


--
-- Name: schedules schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: itbienvenu
--

ALTER TABLE ONLY public.schedules
    ADD CONSTRAINT schedules_pkey PRIMARY KEY (id);


--
-- Name: tickets tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: itbienvenu
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: itbienvenu
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: itbienvenu
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: bus_routes bus_routes_bus_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: itbienvenu
--

ALTER TABLE ONLY public.bus_routes
    ADD CONSTRAINT bus_routes_bus_id_fkey FOREIGN KEY (bus_id) REFERENCES public.buses(id);


--
-- Name: bus_routes bus_routes_route_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: itbienvenu
--

ALTER TABLE ONLY public.bus_routes
    ADD CONSTRAINT bus_routes_route_id_fkey FOREIGN KEY (route_id) REFERENCES public.routes(id);


--
-- Name: bus_schedules bus_schedules_bus_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: itbienvenu
--

ALTER TABLE ONLY public.bus_schedules
    ADD CONSTRAINT bus_schedules_bus_id_fkey FOREIGN KEY (bus_id) REFERENCES public.buses(id);


--
-- Name: bus_schedules bus_schedules_schedule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: itbienvenu
--

ALTER TABLE ONLY public.bus_schedules
    ADD CONSTRAINT bus_schedules_schedule_id_fkey FOREIGN KEY (schedule_id) REFERENCES public.schedules(id);


--
-- Name: bus_stations bus_stations_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: itbienvenu
--

ALTER TABLE ONLY public.bus_stations
    ADD CONSTRAINT bus_stations_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: buses buses_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: itbienvenu
--

ALTER TABLE ONLY public.buses
    ADD CONSTRAINT buses_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: company_user_extra_permissions company_user_extra_permissions_company_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: itbienvenu
--

ALTER TABLE ONLY public.company_user_extra_permissions
    ADD CONSTRAINT company_user_extra_permissions_company_user_id_fkey FOREIGN KEY (company_user_id) REFERENCES public.company_users(id);


--
-- Name: company_user_extra_permissions company_user_extra_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: itbienvenu
--

ALTER TABLE ONLY public.company_user_extra_permissions
    ADD CONSTRAINT company_user_extra_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id);


--
-- Name: company_user_revoked_permissions company_user_revoked_permissions_company_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: itbienvenu
--

ALTER TABLE ONLY public.company_user_revoked_permissions
    ADD CONSTRAINT company_user_revoked_permissions_company_user_id_fkey FOREIGN KEY (company_user_id) REFERENCES public.company_users(id);


--
-- Name: company_user_revoked_permissions company_user_revoked_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: itbienvenu
--

ALTER TABLE ONLY public.company_user_revoked_permissions
    ADD CONSTRAINT company_user_revoked_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id);


--
-- Name: company_user_roles company_user_roles_company_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: itbienvenu
--

ALTER TABLE ONLY public.company_user_roles
    ADD CONSTRAINT company_user_roles_company_user_id_fkey FOREIGN KEY (company_user_id) REFERENCES public.company_users(id) ON DELETE CASCADE;


--
-- Name: company_user_roles company_user_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: itbienvenu
--

ALTER TABLE ONLY public.company_user_roles
    ADD CONSTRAINT company_user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: company_users company_users_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: itbienvenu
--

ALTER TABLE ONLY public.company_users
    ADD CONSTRAINT company_users_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: login_otps login_otps_company_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: itbienvenu
--

ALTER TABLE ONLY public.login_otps
    ADD CONSTRAINT login_otps_company_user_id_fkey FOREIGN KEY (company_user_id) REFERENCES public.company_users(id);


--
-- Name: payments payments_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: itbienvenu
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.tickets(id);


--
-- Name: payments payments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: itbienvenu
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: permissions permissions_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: itbienvenu
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: role_permissions role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: itbienvenu
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: itbienvenu
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: roles roles_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: itbienvenu
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: route_segments route_segments_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: itbienvenu
--

ALTER TABLE ONLY public.route_segments
    ADD CONSTRAINT route_segments_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: route_segments route_segments_end_station_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: itbienvenu
--

ALTER TABLE ONLY public.route_segments
    ADD CONSTRAINT route_segments_end_station_id_fkey FOREIGN KEY (end_station_id) REFERENCES public.bus_stations(id);


--
-- Name: route_segments route_segments_route_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: itbienvenu
--

ALTER TABLE ONLY public.route_segments
    ADD CONSTRAINT route_segments_route_id_fkey FOREIGN KEY (route_id) REFERENCES public.routes(id);


--
-- Name: route_segments route_segments_start_station_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: itbienvenu
--

ALTER TABLE ONLY public.route_segments
    ADD CONSTRAINT route_segments_start_station_id_fkey FOREIGN KEY (start_station_id) REFERENCES public.bus_stations(id);


--
-- Name: routes routes_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: itbienvenu
--

ALTER TABLE ONLY public.routes
    ADD CONSTRAINT routes_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: routes routes_destination_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: itbienvenu
--

ALTER TABLE ONLY public.routes
    ADD CONSTRAINT routes_destination_id_fkey FOREIGN KEY (destination_id) REFERENCES public.bus_stations(id);


--
-- Name: routes routes_origin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: itbienvenu
--

ALTER TABLE ONLY public.routes
    ADD CONSTRAINT routes_origin_id_fkey FOREIGN KEY (origin_id) REFERENCES public.bus_stations(id);


--
-- Name: schedules schedules_bus_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: itbienvenu
--

ALTER TABLE ONLY public.schedules
    ADD CONSTRAINT schedules_bus_id_fkey FOREIGN KEY (bus_id) REFERENCES public.buses(id);


--
-- Name: schedules schedules_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: itbienvenu
--

ALTER TABLE ONLY public.schedules
    ADD CONSTRAINT schedules_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: schedules schedules_route_segment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: itbienvenu
--

ALTER TABLE ONLY public.schedules
    ADD CONSTRAINT schedules_route_segment_id_fkey FOREIGN KEY (route_segment_id) REFERENCES public.route_segments(id);


--
-- Name: tickets tickets_bus_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: itbienvenu
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_bus_id_fkey FOREIGN KEY (bus_id) REFERENCES public.buses(id);


--
-- Name: tickets tickets_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: itbienvenu
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: tickets tickets_route_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: itbienvenu
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_route_id_fkey FOREIGN KEY (route_id) REFERENCES public.routes(id);


--
-- Name: tickets tickets_schedule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: itbienvenu
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_schedule_id_fkey FOREIGN KEY (schedule_id) REFERENCES public.schedules(id);


--
-- Name: tickets tickets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: itbienvenu
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: itbienvenu
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict NS72JeKaecdjtArQ83bzigQHDwasUxVE5aJgg8o9hus1pSJVMfVBDCyvstpzkdz

