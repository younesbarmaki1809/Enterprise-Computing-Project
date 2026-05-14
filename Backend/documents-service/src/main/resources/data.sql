-- Seed data for the DMS documents-service
-- Runs automatically on startup (spring.jpa.defer-datasource-initialization=true)
-- Uses MERGE for H2 compatibility + Postgres compatibility

INSERT INTO department (id, name) VALUES (1, 'Engineering')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO department (id, name) VALUES (2, 'Human Resources')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO department (id, name) VALUES (3, 'Finance')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO department (id, name) VALUES (4, 'Marketing')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO category (id, name, color, description) VALUES (1, 'Report', '#3B82F6', 'Official reports and analyses')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, color = EXCLUDED.color, description = EXCLUDED.description;
INSERT INTO category (id, name, color, description) VALUES (2, 'Policy', '#10B981', 'Company policies and procedures')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, color = EXCLUDED.color, description = EXCLUDED.description;
INSERT INTO category (id, name, color, description) VALUES (3, 'Contract', '#F59E0B', 'Legal contracts and agreements')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, color = EXCLUDED.color, description = EXCLUDED.description;
INSERT INTO category (id, name, color, description) VALUES (4, 'Memo', '#8B5CF6', 'Internal memos and notices')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, color = EXCLUDED.color, description = EXCLUDED.description;

INSERT INTO users (id, name, email, password, role, department_id, status) VALUES (1, 'Admin User', 'admin@ensia.dz', 'admin123', 'admin', 1, 'active')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, password = EXCLUDED.password, role = EXCLUDED.role, department_id = EXCLUDED.department_id, status = EXCLUDED.status;
INSERT INTO users (id, name, email, password, role, department_id, status) VALUES (2, 'Alice Engineer', 'alice@ensia.dz', 'alice123', 'user', 1, 'active')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, password = EXCLUDED.password, role = EXCLUDED.role, department_id = EXCLUDED.department_id, status = EXCLUDED.status;
INSERT INTO users (id, name, email, password, role, department_id, status) VALUES (3, 'Bob Manager', 'bob@ensia.dz', 'bob123', 'user', 2, 'active')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, password = EXCLUDED.password, role = EXCLUDED.role, department_id = EXCLUDED.department_id, status = EXCLUDED.status;
