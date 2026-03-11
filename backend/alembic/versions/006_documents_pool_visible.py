"""add is_pool_visible to documents

Revision ID: 006_documents_pool_visible
Revises: 005_collateral_arrays
Create Date: 2026-03-11
"""
import sqlalchemy as sa
from alembic import op

revision = '006_documents_pool_visible'
down_revision = '005_collateral_arrays'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        'documents',
        sa.Column('is_pool_visible', sa.Boolean(), server_default='true', nullable=False),
    )


def downgrade():
    op.drop_column('documents', 'is_pool_visible')
