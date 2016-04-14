--
-- PostgreSQL database dump
--

-- SET statement_timeout = 0;
-- SET client_encoding = 'UTF8';
-- SET standard_conforming_strings = ON;
-- SET check_function_bodies = FALSE;
-- SET client_min_messages = WARNING;

--
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner: -
--

-- CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;


--
-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner: -
--

-- COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


-- SET search_path = public, pg_catalog;

-- SET default_tablespace = '';

-- SET default_with_oids = false;

--
-- Name: oauth_access_tokens; Type: TABLE; Schema: public; Owner: -; Tablespace:
--

CREATE TABLE oauth_access_tokens (
  access_token TEXT                        NOT NULL,
  client_id    TEXT                        NOT NULL,
  user_id      UUID                        NOT NULL,
  expires      TIMESTAMP WITHOUT TIME ZONE NOT NULL
);

--
-- Name: oauth_clients; Type: TABLE; Schema: public; Owner: -; Tablespace:
--

CREATE TABLE oauth_clients (
  client_id     TEXT NOT NULL,
  client_secret TEXT NOT NULL,
  redirect_uri  TEXT NOT NULL
);

--
-- Name: oauth_refresh_tokens; Type: TABLE; Schema: public; Owner: -; Tablespace:
--

CREATE TABLE oauth_refresh_tokens (
  refresh_token TEXT                        NOT NULL,
  client_id     TEXT                        NOT NULL,
  user_id       UUID                        NOT NULL,
  expires       TIMESTAMP WITHOUT TIME ZONE NOT NULL
);

--
-- Name: users; Type: TABLE; Schema: public; Owner: -; Tablespace:
--

CREATE TABLE users (
  id       UUID PRIMARY KEY,
  username TEXT NOT NULL,
  password TEXT NOT NULL
);

CREATE TABLE oauth_authorization_codes (
  code      TEXT PRIMARY KEY            NOT NULL,
  client_id TEXT                        NOT NULL,
  user_id   UUID                        NOT NULL,
  expires   TIMESTAMP WITHOUT TIME ZONE NOT NULL
);

CREATE TABLE oauth_authorization_type (
  id         SERIAL PRIMARY KEY,
  client_id  TEXT NOT NULL,
  grant_type INT REFERENCES grant_type (id)
);

CREATE TABLE grant_type (
  id         SERIAL PRIMARY KEY,
  grant_type TEXT NOT NULL
);

--
-- Name: oauth_access_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace:
--

ALTER TABLE ONLY oauth_access_tokens
  ADD CONSTRAINT oauth_access_tokens_pkey PRIMARY KEY (access_token);

--
-- Name: oauth_clients_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace:
--

ALTER TABLE ONLY oauth_clients
  ADD CONSTRAINT oauth_clients_pkey PRIMARY KEY (client_id, client_secret);

--
-- Name: oauth_refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace:
--

ALTER TABLE ONLY oauth_refresh_tokens
  ADD CONSTRAINT oauth_refresh_tokens_pkey PRIMARY KEY (refresh_token);

--
-- Name: users_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace:
--

-- ALTER TABLE ONLY users
--   ADD CONSTRAINT users_pkey PRIMARY KEY (id);

--
-- Name: users_username_password; Type: INDEX; Schema: public; Owner: -; Tablespace:
--

CREATE INDEX users_username_password ON users USING BTREE (username, password);

--
-- PostgreSQL database dump complete
--
