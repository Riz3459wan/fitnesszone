-- Database-per-service. Local-only password (production mein secrets manager).
CREATE USER gym_user          WITH PASSWORD 'gym-local-pass';
CREATE DATABASE gym_db          OWNER gym_user;
CREATE USER identity_user     WITH PASSWORD 'gym-local-pass';
CREATE DATABASE identity_db     OWNER identity_user;
CREATE USER member_user       WITH PASSWORD 'gym-local-pass';
CREATE DATABASE member_db       OWNER member_user;
CREATE USER billing_user      WITH PASSWORD 'gym-local-pass';
CREATE DATABASE billing_db      OWNER billing_user;
CREATE USER attendance_user   WITH PASSWORD 'gym-local-pass';
CREATE DATABASE attendance_db   OWNER attendance_user;
CREATE USER notification_user WITH PASSWORD 'gym-local-pass';
CREATE DATABASE notification_db OWNER notification_user;
CREATE USER reporting_user    WITH PASSWORD 'gym-local-pass';
CREATE DATABASE reporting_db    OWNER reporting_user;
