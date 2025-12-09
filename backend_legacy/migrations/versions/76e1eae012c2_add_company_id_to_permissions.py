"""add company_id to permissions

Revision ID: 76e1eae012c2
Revises: 
Create Date: 2025-12-02 20:23:21.625441

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '76e1eae012c2'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add company_id column to permissions table
    op.add_column(
        "permissions",
        sa.Column("company_id", sa.String(), nullable=True),
    )
    # Create foreign key constraint
    op.create_foreign_key(
        "permissions_company_id_fkey",
        "permissions",
        "companies",
        ["company_id"],
        ["id"],
    )
    # Drop the unique constraint on name (we'll have unique per company instead)
    # Use if_exists=True equivalent by checking constraint existence first
    from sqlalchemy import inspect
    bind = op.get_bind()
    inspector = inspect(bind)
    constraints = [c['name'] for c in inspector.get_unique_constraints('permissions')]
    if 'permissions_name_key' in constraints:
        op.drop_constraint("permissions_name_key", "permissions", type_="unique")


def downgrade() -> None:
    """Downgrade schema."""
    # Drop foreign key
    op.drop_constraint("permissions_company_id_fkey", "permissions", type_="foreignkey")
    # Drop column
    op.drop_column("permissions", "company_id")
    # Note: We don't re-add the unique constraint on name as it may already exist
