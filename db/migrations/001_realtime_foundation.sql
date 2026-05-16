CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS ps_aors (
  id varchar(40) PRIMARY KEY,
  contact text,
  default_expiration integer,
  mailboxes varchar(80),
  max_contacts integer,
  minimum_expiration integer,
  remove_existing varchar(3),
  qualify_frequency integer,
  authenticate_qualify varchar(3),
  maximum_expiration integer,
  outbound_proxy varchar(256),
  support_path varchar(3),
  qualify_timeout double precision,
  voicemail_extension varchar(40),
  remove_unavailable varchar(3)
);

CREATE TABLE IF NOT EXISTS ps_auths (
  id varchar(40) PRIMARY KEY,
  auth_type varchar(20),
  nonce_lifetime integer,
  md5_cred varchar(40),
  password varchar(80),
  realm varchar(40),
  username varchar(40),
  refresh_token varchar(255),
  oauth_clientid varchar(255),
  oauth_secret varchar(255)
);

CREATE TABLE IF NOT EXISTS ps_endpoints (
  id varchar(40) PRIMARY KEY,
  transport varchar(40),
  aors varchar(200),
  auth varchar(40),
  context varchar(40),
  disallow varchar(200),
  allow varchar(200),
  direct_media varchar(3),
  connected_line_method varchar(20),
  direct_media_method varchar(20),
  direct_media_glare_mitigation varchar(20),
  disable_direct_media_on_nat varchar(3),
  dtmf_mode varchar(20),
  external_media_address varchar(40),
  force_rport varchar(3),
  ice_support varchar(3),
  identify_by varchar(80),
  mailboxes varchar(80),
  moh_suggest varchar(80),
  outbound_auth varchar(40),
  outbound_proxy varchar(256),
  rewrite_contact varchar(3),
  rtp_ipv6 varchar(3),
  rtp_symmetric varchar(3),
  send_diversion varchar(3),
  send_pai varchar(3),
  send_rpid varchar(3),
  timers_min_se integer,
  timers varchar(20),
  timers_sess_expires integer,
  callerid varchar(80),
  callerid_privacy varchar(20),
  callerid_tag varchar(40),
  trust_id_inbound varchar(3),
  trust_id_outbound varchar(3),
  use_ptime varchar(3),
  use_avpf varchar(3),
  media_encryption varchar(20),
  inband_progress varchar(3),
  call_group varchar(40),
  pickup_group varchar(40),
  named_call_group varchar(40),
  named_pickup_group varchar(40),
  device_state_busy_at integer,
  fax_detect varchar(3),
  t38_udptl varchar(3),
  t38_udptl_ec varchar(20),
  t38_udptl_maxdatagram integer,
  t38_udptl_nat varchar(3),
  t38_udptl_ipv6 varchar(3),
  tone_zone varchar(40),
  language varchar(40),
  one_touch_recording varchar(3),
  record_on_feature varchar(40),
  record_off_feature varchar(40),
  rtp_engine varchar(40),
  allow_transfer varchar(3),
  allow_subscribe varchar(3),
  sdp_owner varchar(40),
  sdp_session varchar(40),
  tos_audio varchar(10),
  tos_video varchar(10),
  sub_min_expiry integer,
  from_domain varchar(80),
  from_user varchar(80),
  mwi_from_user varchar(80),
  dtls_verify varchar(40),
  dtls_rekey varchar(40),
  dtls_cert_file varchar(200),
  dtls_private_key varchar(200),
  dtls_cipher varchar(200),
  dtls_ca_file varchar(200),
  dtls_ca_path varchar(200),
  dtls_setup varchar(20),
  dtls_auto_generate_cert varchar(3),
  srtp_tag_32 varchar(3),
  media_address varchar(80),
  redirect_method varchar(20),
  set_var text,
  cos_audio integer,
  cos_video integer,
  message_context varchar(40),
  force_avp varchar(3),
  media_use_received_transport varchar(3),
  accountcode varchar(80),
  user_eq_phone varchar(3),
  moh_passthrough varchar(3),
  media_encryption_optimistic varchar(3),
  rpid_immediate varchar(3),
  g726_non_standard varchar(3),
  rtp_keepalive integer,
  rtp_timeout integer,
  rtp_timeout_hold integer,
  bind_rtp_to_media_address varchar(3),
  voicemail_extension varchar(40),
  mwi_subscribe_replaces_unsolicited varchar(3),
  deny varchar(95),
  permit varchar(95),
  acl varchar(40),
  contact_deny varchar(95),
  contact_permit varchar(95),
  contact_acl varchar(40),
  subscribe_context varchar(40),
  fax_detect_timeout integer,
  contact_user varchar(80),
  preferred_codec_only varchar(3),
  asymmetric_rtp_codec varchar(3),
  rtcp_mux varchar(3),
  allow_overlap varchar(3),
  refer_blind_progress varchar(3),
  notify_early_inuse_ringing varchar(3),
  max_audio_streams integer,
  max_video_streams integer,
  bundle varchar(3),
  webrtc varchar(3)
);

CREATE TABLE IF NOT EXISTS ps_contacts (
  id varchar(255) PRIMARY KEY,
  uri varchar(511),
  expiration_time bigint,
  qualify_frequency integer,
  outbound_proxy varchar(256),
  path text,
  user_agent varchar(255),
  qualify_timeout double precision,
  reg_server varchar(255),
  authenticate_qualify varchar(3),
  via_addr varchar(40),
  via_port integer,
  call_id varchar(255),
  endpoint varchar(40),
  prune_on_boot varchar(3)
);

CREATE INDEX IF NOT EXISTS ps_contacts_endpoint_idx ON ps_contacts (endpoint);

CREATE TABLE IF NOT EXISTS ps_domain_aliases (
  id varchar(40) PRIMARY KEY,
  domain varchar(80)
);

CREATE TABLE IF NOT EXISTS ps_endpoint_id_ips (
  id varchar(40) PRIMARY KEY,
  endpoint varchar(40),
  match varchar(80),
  srv_lookups varchar(3),
  match_header varchar(255)
);

CREATE TABLE IF NOT EXISTS tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug varchar(80) NOT NULL UNIQUE,
  name varchar(160) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  extension varchar(40) NOT NULL,
  display_name varchar(160) NOT NULL,
  sip_password varchar(120) NOT NULL,
  status varchar(40) NOT NULL DEFAULT 'offline',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, extension)
);

CREATE TABLE IF NOT EXISTS queues (
  name varchar(128) PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  musiconhold varchar(128),
  announce varchar(128),
  context varchar(128),
  timeout integer,
  ringinuse varchar(3),
  setinterfacevar varchar(3),
  setqueuevar varchar(3),
  setqueueentryvar varchar(3),
  monitor_format varchar(8),
  membermacro varchar(512),
  membergosub varchar(512),
  queue_youarenext varchar(128),
  queue_thereare varchar(128),
  queue_callswaiting varchar(128),
  queue_quantity1 varchar(128),
  queue_quantity2 varchar(128),
  queue_holdtime varchar(128),
  queue_minutes varchar(128),
  queue_minute varchar(128),
  queue_seconds varchar(128),
  queue_thankyou varchar(128),
  queue_callerannounce varchar(128),
  queue_reporthold varchar(128),
  announce_frequency integer,
  announce_to_first_user varchar(3),
  min_announce_frequency integer,
  announce_round_seconds integer,
  announce_holdtime varchar(128),
  announce_position varchar(128),
  announce_position_limit integer,
  periodic_announce varchar(50),
  periodic_announce_frequency integer,
  relative_periodic_announce varchar(3),
  random_periodic_announce varchar(3),
  retry integer,
  wrapuptime integer,
  penaltymemberslimit integer,
  autofill varchar(3),
  monitor_type varchar(128),
  autopause varchar(128),
  autopausedelay integer,
  autopausebusy varchar(3),
  autopauseunavail varchar(3),
  maxlen integer,
  servicelevel integer,
  strategy varchar(128),
  joinempty varchar(128),
  leavewhenempty varchar(128),
  reportholdtime varchar(3),
  memberdelay integer,
  weight integer,
  timeoutrestart varchar(3),
  defaultrule varchar(128),
  timeoutpriority varchar(128),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS queue_members (
  uniqueid serial PRIMARY KEY,
  queue_name varchar(128) NOT NULL REFERENCES queues(name) ON DELETE CASCADE,
  interface varchar(128) NOT NULL,
  membername varchar(128),
  state_interface varchar(128),
  penalty integer,
  paused integer,
  wrapuptime integer,
  ringinuse varchar(3)
);

CREATE UNIQUE INDEX IF NOT EXISTS queue_members_queue_interface_idx ON queue_members (queue_name, interface);

CREATE TABLE IF NOT EXISTS routing_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name varchar(160) NOT NULL,
  priority integer NOT NULL DEFAULT 100,
  match jsonb NOT NULL DEFAULT '{}'::jsonb,
  action jsonb NOT NULL DEFAULT '{}'::jsonb,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS call_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE SET NULL,
  ari_channel_id varchar(120),
  caller varchar(120),
  callee varchar(120),
  state varchar(40) NOT NULL DEFAULT 'new',
  direction varchar(40) NOT NULL DEFAULT 'internal',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz
);

INSERT INTO tenants (slug, name)
VALUES ('default', 'Default Tenant')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO ps_aors (id, max_contacts, remove_existing, remove_unavailable, qualify_frequency, support_path)
VALUES
  ('6001', 1, 'yes', 'yes', 30, 'yes'),
  ('6002', 1, 'yes', 'yes', 30, 'yes')
ON CONFLICT (id) DO NOTHING;

INSERT INTO ps_auths (id, auth_type, username, password)
VALUES
  ('6001', 'userpass', '6001', '6001pass'),
  ('6002', 'userpass', '6002', '6002pass')
ON CONFLICT (id) DO NOTHING;

INSERT INTO ps_endpoints (
  id,
  transport,
  context,
  disallow,
  allow,
  auth,
  aors,
  webrtc,
  direct_media,
  use_avpf,
  force_avp,
  media_encryption,
  dtls_auto_generate_cert,
  dtls_verify,
  dtls_setup,
  ice_support,
  media_use_received_transport,
  rtcp_mux,
  rewrite_contact,
  rtp_symmetric,
  force_rport,
  allow_transfer,
  allow_subscribe
)
VALUES
  ('6001', 'transport-wss', 'internal', 'all', 'opus,ulaw,alaw', '6001', '6001', 'yes', 'no', 'yes', 'yes', 'dtls', 'yes', 'fingerprint', 'actpass', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'no'),
  ('6002', 'transport-wss', 'internal', 'all', 'opus,ulaw,alaw', '6002', '6002', 'yes', 'no', 'yes', 'yes', 'dtls', 'yes', 'fingerprint', 'actpass', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'no')
ON CONFLICT (id) DO NOTHING;

INSERT INTO agents (tenant_id, extension, display_name, sip_password, status)
SELECT id, '6001', 'Agent 6001', '6001pass', 'offline' FROM tenants WHERE slug = 'default'
ON CONFLICT (tenant_id, extension) DO NOTHING;

INSERT INTO agents (tenant_id, extension, display_name, sip_password, status)
SELECT id, '6002', 'Agent 6002', '6002pass', 'offline' FROM tenants WHERE slug = 'default'
ON CONFLICT (tenant_id, extension) DO NOTHING;
