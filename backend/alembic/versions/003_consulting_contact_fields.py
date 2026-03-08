"""add name, position, email to consultings

Revision ID: 003_consulting_contact_fields
Revises: 002_glossary_seed
Create Date: 2026-03-08
"""
import sqlalchemy as sa
from alembic import op

revision = '003_consulting_contact_fields'
down_revision = '002_glossary_seed'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('consultings', sa.Column('name', sa.String(100), nullable=True))
    op.add_column('consultings', sa.Column('position', sa.String(100), nullable=True))
    op.add_column('consultings', sa.Column('email', sa.String(200), nullable=True))

    # Backfill existing rows with defaults
    op.execute("UPDATE consultings SET name = '' WHERE name IS NULL")
    op.execute("UPDATE consultings SET email = '' WHERE email IS NULL")

    # Now make required columns non-nullable
    op.alter_column('consultings', 'name', nullable=False)
    op.alter_column('consultings', 'email', nullable=False)


def downgrade():
    op.drop_column('consultings', 'email')
    op.drop_column('consultings', 'position')
    op.drop_column('consultings', 'name')
