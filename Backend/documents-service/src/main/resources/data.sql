-- Seed data for the DMS documents-service
-- Runs automatically on startup (spring.jpa.defer-datasource-initialization=true)
-- Uses MERGE for H2 compatibility + Postgres compatibility

MERGE INTO department (id, name) KEY (id) VALUES (1, 'Engineering');
MERGE INTO department (id, name) KEY (id) VALUES (2, 'Human Resources');
MERGE INTO department (id, name) KEY (id) VALUES (3, 'Finance');
MERGE INTO department (id, name) KEY (id) VALUES (4, 'Marketing');

MERGE INTO category (id, name, color, description) KEY (id) VALUES (1, 'Report', '#3B82F6', 'Official reports and analyses');
MERGE INTO category (id, name, color, description) KEY (id) VALUES (2, 'Policy', '#10B981', 'Company policies and procedures');
MERGE INTO category (id, name, color, description) KEY (id) VALUES (3, 'Contract', '#F59E0B', 'Legal contracts and agreements');
MERGE INTO category (id, name, color, description) KEY (id) VALUES (4, 'Memo', '#8B5CF6', 'Internal memos and notices');

MERGE INTO users (id, name, email, password, role, department_id, status) KEY (id) VALUES (1, 'Admin User', 'admin@ensia.dz', 'admin123', 'admin', 1, 'active');
MERGE INTO users (id, name, email, password, role, department_id, status) KEY (id) VALUES (2, 'Alice Engineer', 'alice@ensia.dz', 'alice123', 'user', 1, 'active');
MERGE INTO users (id, name, email, password, role, department_id, status) KEY (id) VALUES (3, 'Bob Manager', 'bob@ensia.dz', 'bob123', 'user', 2, 'active');
