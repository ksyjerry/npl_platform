"""Add bond_type, transfer_count, extra_data to bonds

Revision ID: 008
Revises: 007_bonds
"""
from alembic import op
import sqlalchemy as sa

revision = "008_bond_type_extra"
down_revision = "007_bonds"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("bonds", sa.Column("bond_type", sa.String(20), nullable=True))
    op.add_column("bonds", sa.Column("transfer_count", sa.Integer(), nullable=True))
    op.add_column("bonds", sa.Column("extra_data", sa.JSON(), nullable=True))
    op.create_index("idx_bonds_bond_type", "bonds", ["bond_type"])
    op.create_index("idx_bonds_creditor", "bonds", ["creditor"])


def downgrade() -> None:
    op.drop_index("idx_bonds_creditor")
    op.drop_index("idx_bonds_bond_type")
    op.drop_column("bonds", "extra_data")
    op.drop_column("bonds", "transfer_count")
    op.drop_column("bonds", "bond_type")
