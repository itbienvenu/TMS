
-- Insert Global Permissions (Templates)
INSERT INTO permissions (id, name, company_id) VALUES ('696f98f1-430a-462b-a810-b22f54fad497','create_user', NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO permissions (id, name, company_id) VALUES ('6516d275-8053-4909-945f-95072286a395','view_user', NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO permissions (id, name, company_id) VALUES ('4a19375c-b6a5-4025-8150-7ac7f4abf8b4','update_user', NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO permissions (id, name, company_id) VALUES ('fc1b8115-ea4a-42b9-ad92-fe8e74042b4a','delete_user', NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO permissions (id, name, company_id) VALUES ('3549f256-c0a7-4b6a-b7c7-dd29af5aeb59','view_ticket', NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO permissions (id, name, company_id) VALUES ('88e41c2c-1af2-4084-bc02-9fe4376dca9d','update_ticket', NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO permissions (id, name, company_id) VALUES ('56cf73f5-c0b5-4a67-b719-f4481b9f9c89','delete_ticket', NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO permissions (id, name, company_id) VALUES ('21f21eea-a334-4793-8f61-68a1b12c494b','create_payment', NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO permissions (id, name, company_id) VALUES ('86d3ba3c-4622-40b8-ad3f-6c879c186b42','view_payment', NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO permissions (id, name, company_id) VALUES ('59bf3bbd-5f74-4e2c-844e-da0c020e3a6b','update_payment', NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO permissions (id, name, company_id) VALUES ('e1b67670-a0cc-4aad-acd8-a861ee52db1c','delete_payment', NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO permissions (id, name, company_id) VALUES ('bac6d055-27db-451e-9598-a41998099439','create_role', NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO permissions (id, name, company_id) VALUES ('f7d245b6-20c6-4383-bc6c-ee558d38e9fd','view_role', NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO permissions (id, name, company_id) VALUES ('28f45dc9-c20a-430a-ac59-251234c91cbc','update_role', NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO permissions (id, name, company_id) VALUES ('eb0c8ff7-d208-4afb-a914-989090b5f819','delete_role', NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO permissions (id, name, company_id) VALUES ('838ca9f5-8dec-4d4e-8117-1a1ea4d23c23','assign_role', NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO permissions (id, name, company_id) VALUES ('1b836d28-3a4a-4318-b339-70ac25cb6e22','access_dashboard', NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO permissions (id, name, company_id) VALUES ('42c7337b-e0de-4da8-9f82-a731d11a2e93','manage_permissions', NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO permissions (id, name, company_id) VALUES ('e9d9702a-864e-4a5c-a3c8-d12cea6adb43','create_permission', NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO permissions (id, name, company_id) VALUES ('41b9c441-56c6-4dd5-a895-e9e236fc900e','assign_permission', NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO permissions (id, name, company_id) VALUES ('91c05ac9-128d-4b34-ae87-53195993779f','get_permission', NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO permissions (id, name, company_id) VALUES ('7b77033b-da6b-4e23-8fde-ee5db856877f','delete_permission', NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO permissions (id, name, company_id) VALUES ('c1f01aa5-e5da-4b58-953b-2d26648276bf','view_users', NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO permissions (id, name, company_id) VALUES ('244422cb-62b0-4699-8b8d-8984dd338116','list_all_roles', NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO permissions (id, name, company_id) VALUES ('64c67587-db9d-411b-93ce-84ca6e4b72f7','create_route', NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO permissions (id, name, company_id) VALUES ('d6b4cf86-aa78-463f-820b-92d4c82209b8','update_route', NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO permissions (id, name, company_id) VALUES ('fc98764c-c410-43da-aba9-66626f75cb5c','delete_route', NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO permissions (id, name, company_id) VALUES ('62f90a53-0629-4c99-9c28-8a6e74559d5d','assign_bus_route', NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO permissions (id, name, company_id) VALUES ('4c356884-8053-456a-8046-17b2034fdfd3','delete_db', NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO permissions (id, name, company_id) VALUES ('972974b8-16f0-4a82-84c2-0f2950c8e9d1','create_ticket', NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO permissions (id, name, company_id) VALUES ('c0b6259e-bb1c-4744-8c46-0ae419431214','see_all_tickets', NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO permissions (id, name, company_id) VALUES ('4b040bc2-03c4-43fc-913c-ba6677658042','delete_bus', NULL) ON CONFLICT (id) DO NOTHING;

-- Assign permissions to Company Admin
DO $$
DECLARE
    target_company_id TEXT := 'c3e9c52f-678c-4d5b-afe7-d9c7fa1f9a58';
    target_role_id TEXT := '6b50e83d-8c49-4404-97a8-8799c91343da';
    perm RECORD;
    new_perm_id TEXT;
BEGIN
    FOR perm IN SELECT name FROM permissions WHERE company_id IS NULL LOOP
        -- Check if permission exists for company
        SELECT id INTO new_perm_id FROM permissions WHERE name = perm.name AND company_id = target_company_id;
        
        -- If not, create it
        IF new_perm_id IS NULL THEN
            new_perm_id := gen_random_uuid();
            INSERT INTO permissions (id, name, company_id) VALUES (new_perm_id, perm.name, target_company_id);
        END IF;

        -- Assign to role if not exists
        INSERT INTO role_permissions (role_id, permission_id) 
        VALUES (target_role_id, new_perm_id)
        ON CONFLICT DO NOTHING;
    END LOOP;
END $$;
