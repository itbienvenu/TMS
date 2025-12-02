"""add company_user table and separate from user

Revision ID: ee78cd4d53e8
Revises: 76e1eae012c2
Create Date: 2025-12-02 21:11:09.571276

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ee78cd4d53e8'
down_revision: Union[str, Sequence[str], None] = '76e1eae012c2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    from sqlalchemy import inspect
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_tables = inspector.get_table_names()
    
    # 1. Create company_users table (if it doesn't exist)
    if "company_users" not in existing_tables:
        op.create_table(
            "company_users",
            sa.Column("id", sa.String(), nullable=False),
            sa.Column("full_name", sa.String(), nullable=False),
            sa.Column("email", sa.String(), nullable=True),
            sa.Column("login_email", sa.String(), nullable=True),
            sa.Column("phone_number", sa.String(), nullable=True),
            sa.Column("password_hash", sa.String(), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=True),
            sa.Column("company_id", sa.String(), nullable=False),
            sa.ForeignKeyConstraint(["company_id"], ["companies.id"], name="company_users_company_id_fkey"),
            sa.PrimaryKeyConstraint("id", name="company_users_pkey"),
        )
    
    # 2. Create company_user_roles join table (if it doesn't exist)
    if "company_user_roles" not in existing_tables:
        op.create_table(
            "company_user_roles",
            sa.Column("company_user_id", sa.String(), nullable=False),
            sa.Column("role_id", sa.String(), nullable=False),
            sa.ForeignKeyConstraint(["company_user_id"], ["company_users.id"], name="company_user_roles_company_user_id_fkey"),
            sa.ForeignKeyConstraint(["role_id"], ["roles.id"], name="company_user_roles_role_id_fkey"),
            sa.PrimaryKeyConstraint("company_user_id", "role_id", name="company_user_roles_pkey"),
        )
    
    # 3. Create company_user_extra_permissions join table (if it doesn't exist)
    if "company_user_extra_permissions" not in existing_tables:
        op.create_table(
            "company_user_extra_permissions",
            sa.Column("company_user_id", sa.String(), nullable=False),
            sa.Column("permission_id", sa.String(), nullable=False),
            sa.ForeignKeyConstraint(["company_user_id"], ["company_users.id"], name="company_user_extra_permissions_company_user_id_fkey"),
            sa.ForeignKeyConstraint(["permission_id"], ["permissions.id"], name="company_user_extra_permissions_permission_id_fkey"),
            sa.PrimaryKeyConstraint("company_user_id", "permission_id", name="company_user_extra_permissions_pkey"),
        )
    
    # 4. Create company_user_revoked_permissions join table (if it doesn't exist)
    if "company_user_revoked_permissions" not in existing_tables:
        op.create_table(
            "company_user_revoked_permissions",
            sa.Column("company_user_id", sa.String(), nullable=False),
            sa.Column("permission_id", sa.String(), nullable=False),
            sa.ForeignKeyConstraint(["company_user_id"], ["company_users.id"], name="company_user_revoked_permissions_company_user_id_fkey"),
            sa.ForeignKeyConstraint(["permission_id"], ["permissions.id"], name="company_user_revoked_permissions_permission_id_fkey"),
            sa.PrimaryKeyConstraint("company_user_id", "permission_id", name="company_user_revoked_permissions_pkey"),
        )
    
    # 5. Update login_otps table: change user_id to company_user_id
    # Check if company_user_id column already exists
    login_otps_columns = []
    if "login_otps" in existing_tables:
        login_otps_columns = [col['name'] for col in inspector.get_columns('login_otps')]
    if "login_otps" in existing_tables and "company_user_id" not in login_otps_columns:
        op.add_column("login_otps", sa.Column("company_user_id", sa.String(), nullable=True))
        # Migrate existing data if any (copy user_id to company_user_id for users with company_id)
        if "user_id" in login_otps_columns:
            op.execute("""
                UPDATE login_otps 
                SET company_user_id = login_otps.user_id 
                WHERE EXISTS (
                    SELECT 1 FROM users 
                    WHERE users.id = login_otps.user_id 
                    AND users.company_id IS NOT NULL
                )
            """)
            # Drop old foreign key and column
            try:
                op.drop_constraint("login_otps_user_id_fkey", "login_otps", type_="foreignkey")
            except Exception:
                pass  # Constraint might not exist
            op.drop_column("login_otps", "user_id")
        
        # Create new foreign key
        op.create_foreign_key(
            "login_otps_company_user_id_fkey",
            "login_otps",
            "company_users",
            ["company_user_id"],
            ["id"],
        )
        op.alter_column("login_otps", "company_user_id", nullable=False)
    
    # 6. Migrate existing company users from users to company_users (only if users table has company_id)
    users_columns = []
    if "users" in existing_tables:
        users_columns = [col['name'] for col in inspector.get_columns('users')]
    if "users" in existing_tables and "company_id" in users_columns:
        # Check if migration already happened (count existing company_users)
        if "company_users" in existing_tables:
            result = op.get_bind().execute(sa.text("SELECT COUNT(*) FROM company_users")).scalar()
        else:
            result = 0
        if result == 0:  # Only migrate if company_users table is empty
            op.execute("""
                INSERT INTO company_users (id, full_name, email, login_email, phone_number, password_hash, created_at, company_id)
                SELECT id, full_name, email, login_email, phone_number, password_hash, created_at, company_id
                FROM users
                WHERE company_id IS NOT NULL
                AND id NOT IN (SELECT id FROM company_users)
            """)
            
            # 7. Migrate user_roles to company_user_roles for migrated users
            if "user_roles" in existing_tables:
                op.execute("""
                    INSERT INTO company_user_roles (company_user_id, role_id)
                    SELECT ur.user_id, ur.role_id
                    FROM user_roles ur
                    WHERE ur.user_id IN (SELECT id FROM company_users)
                    AND NOT EXISTS (
                        SELECT 1 FROM company_user_roles cur 
                        WHERE cur.company_user_id = ur.user_id 
                        AND cur.role_id = ur.role_id
                    )
                """)
            
            # 8. Migrate user_extra_permissions to company_user_extra_permissions
            if "user_extra_permissions" in existing_tables:
                op.execute("""
                    INSERT INTO company_user_extra_permissions (company_user_id, permission_id)
                    SELECT uep.user_id, uep.permission_id
                    FROM user_extra_permissions uep
                    WHERE uep.user_id IN (SELECT id FROM company_users)
                    AND NOT EXISTS (
                        SELECT 1 FROM company_user_extra_permissions cuep 
                        WHERE cuep.company_user_id = uep.user_id 
                        AND cuep.permission_id = uep.permission_id
                    )
                """)
            
            # 9. Migrate user_revoked_permissions to company_user_revoked_permissions
            if "user_revoked_permissions" in existing_tables:
                op.execute("""
                    INSERT INTO company_user_revoked_permissions (company_user_id, permission_id)
                    SELECT urp.user_id, urp.permission_id
                    FROM user_revoked_permissions urp
                    WHERE urp.user_id IN (SELECT id FROM company_users)
                    AND NOT EXISTS (
                        SELECT 1 FROM company_user_revoked_permissions curp 
                        WHERE curp.company_user_id = urp.user_id 
                        AND curp.permission_id = urp.permission_id
                    )
                """)
        
        # 10. Drop old join tables (they're replaced by company_user versions)
        if "user_revoked_permissions" in existing_tables:
            op.drop_table("user_revoked_permissions")
        if "user_extra_permissions" in existing_tables:
            op.drop_table("user_extra_permissions")
        if "user_roles" in existing_tables:
            op.drop_table("user_roles")
        
        # 11. Remove company_id from users table (users are now customers only)
        try:
            op.drop_constraint("users_company_id_fkey", "users", type_="foreignkey")
        except Exception:
            pass  # Constraint might not exist
        if "company_id" in users_columns:
            op.drop_column("users", "company_id")
        if "login_email" in users_columns:
            op.drop_column("users", "login_email")  # login_email is only for company users


def downgrade() -> None:
    """Downgrade schema."""
    # Re-add company_id and login_email to users
    op.add_column("users", sa.Column("company_id", sa.String(), nullable=True))
    op.add_column("users", sa.Column("login_email", sa.String(), nullable=True))
    op.create_foreign_key("users_company_id_fkey", "users", "companies", ["company_id"], ["id"])
    
    # Re-create old join tables
    op.create_table(
        "user_roles",
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("role_id", sa.String(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["role_id"], ["roles.id"]),
        sa.PrimaryKeyConstraint("user_id", "role_id"),
    )
    op.create_table(
        "user_extra_permissions",
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("permission_id", sa.String(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["permission_id"], ["permissions.id"]),
        sa.PrimaryKeyConstraint("user_id", "permission_id"),
    )
    op.create_table(
        "user_revoked_permissions",
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("permission_id", sa.String(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["permission_id"], ["permissions.id"]),
        sa.PrimaryKeyConstraint("user_id", "permission_id"),
    )
    
    # Revert login_otps
    op.add_column("login_otps", sa.Column("user_id", sa.String(), nullable=True))
    op.drop_constraint("login_otps_company_user_id_fkey", "login_otps", type_="foreignkey")
    op.drop_column("login_otps", "company_user_id")
    op.create_foreign_key("login_otps_user_id_fkey", "login_otps", "users", ["user_id"], ["id"])
    
    # Drop company_user tables
    op.drop_table("company_user_revoked_permissions")
    op.drop_table("company_user_extra_permissions")
    op.drop_table("company_user_roles")
    op.drop_table("company_users")
