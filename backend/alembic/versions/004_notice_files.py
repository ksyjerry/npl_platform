"""create notice_files table

Revision ID: 004_notice_files
Revises: 003_consulting_contact_fields
Create Date: 2026-03-11
"""
import sqlalchemy as sa
from alembic import op

revision = '004_notice_files'
down_revision = '003_consulting_contact_fields'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'notice_files',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('notice_id', sa.Integer(), sa.ForeignKey('notices.id', ondelete='CASCADE'), nullable=False),
        sa.Column('file_name', sa.String(500), nullable=False),
        sa.Column('file_path_enc', sa.Text(), nullable=False),
        sa.Column('file_size', sa.BigInteger(), nullable=True),
        sa.Column('sort_order', sa.Integer(), server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('idx_notice_files_notice_id', 'notice_files', ['notice_id'])


def downgrade():
    op.drop_index('idx_notice_files_notice_id')
    op.drop_table('notice_files')
