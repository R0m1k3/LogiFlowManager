-- LogiFlow Database Initialization Script
-- This script creates the initial database structure and default data

-- Create admin user (password: admin123)
INSERT INTO users (id, email, first_name, last_name, password, role, created_at, updated_at) VALUES 
('admin_001', 'admin@logiflow.com', 'Administrateur', 'Système', '$6567dfa8b0c0c6b8e8b0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7g8h9i0j1.16charsalt', 'admin', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Create default groups/stores
INSERT INTO groups (name, color, created_at, updated_at) VALUES 
('Magasin Principal', '#1976D2', NOW(), NOW()),
('Entrepôt Central', '#388E3C', NOW(), NOW()),
('Magasin Secondaire', '#F57C00', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Create default suppliers
INSERT INTO suppliers (name, contact, phone, email, address, created_at, updated_at) VALUES 
('Fournisseur Alpha', 'Jean Martin', '01.23.45.67.89', 'contact@alpha.com', '123 Rue de la Paix, 75001 Paris', NOW(), NOW()),
('Fournisseur Beta', 'Marie Dubois', '01.98.76.54.32', 'info@beta.com', '456 Avenue des Champs, 69000 Lyon', NOW(), NOW()),
('Fournisseur Gamma', 'Pierre Durand', '01.11.22.33.44', 'service@gamma.com', '789 Boulevard Central, 13000 Marseille', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Assign admin to all groups
INSERT INTO user_groups (user_id, group_id, created_at) 
SELECT 'admin_001', id, NOW() FROM groups 
ON CONFLICT DO NOTHING;