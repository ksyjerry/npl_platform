"""create bonds and bond_import_logs tables

Revision ID: 007_bonds
Revises: 006_documents_pool_visible
Create Date: 2026-03-11
"""
import sqlalchemy as sa
from alembic import op

revision = '007_bonds'
down_revision = '006_documents_pool_visible'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'bonds',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('pool_id', sa.Integer(), sa.ForeignKey('pools.id'), nullable=False),
        sa.Column('bond_no', sa.String(100), nullable=True),
        sa.Column('debtor_type', sa.String(50), nullable=True),
        sa.Column('debtor_id_masked', sa.String(100), nullable=True),
        sa.Column('creditor', sa.String(200), nullable=True),
        sa.Column('product_type', sa.String(100), nullable=True),
        sa.Column('collateral_type', sa.String(100), nullable=True),
        sa.Column('collateral_address', sa.Text(), nullable=True),
        sa.Column('original_amount', sa.BigInteger(), nullable=True),
        sa.Column('opb', sa.BigInteger(), nullable=True),
        sa.Column('interest_balance', sa.BigInteger(), nullable=True),
        sa.Column('total_balance', sa.BigInteger(), nullable=True),
        sa.Column('overdue_start_date', sa.Date(), nullable=True),
        sa.Column('overdue_months', sa.Integer(), nullable=True),
        sa.Column('legal_status', sa.String(100), nullable=True),
        sa.Column('import_batch', sa.String(100), nullable=True),
        sa.Column('created_by', sa.Integer(), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('is_deleted', sa.Boolean(), server_default='false', nullable=False),
    )
    op.create_index('idx_bonds_pool_id', 'bonds', ['pool_id'])
    op.create_index('idx_bonds_debtor_type', 'bonds', ['debtor_type'])
    op.create_index('idx_bonds_collateral_type', 'bonds', ['collateral_type'])

    op.create_table(
        'bond_import_logs',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('pool_id', sa.Integer(), sa.ForeignKey('pools.id'), nullable=False),
        sa.Column('file_name', sa.String(500), nullable=False),
        sa.Column('row_count', sa.Integer(), server_default='0'),
        sa.Column('success_count', sa.Integer(), server_default='0'),
        sa.Column('error_count', sa.Integer(), server_default='0'),
        sa.Column('errors', sa.JSON(), nullable=True),
        sa.Column('imported_by', sa.Integer(), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade():
    op.drop_table('bond_import_logs')
    op.drop_index('idx_bonds_collateral_type')
    op.drop_index('idx_bonds_debtor_type')
    op.drop_index('idx_bonds_pool_id')
    op.drop_table('bonds')
