"""convert collateral_large/small to TEXT arrays

Revision ID: 005_collateral_arrays
Revises: 004_notice_files
Create Date: 2026-03-11
"""
from alembic import op

revision = '005_collateral_arrays'
down_revision = '004_notice_files'
branch_labels = None
depends_on = None


def upgrade():
    op.execute(
        "ALTER TABLE pools ALTER COLUMN collateral_large TYPE TEXT[] "
        "USING CASE WHEN collateral_large IS NOT NULL THEN ARRAY[collateral_large] ELSE NULL END"
    )
    op.execute(
        "ALTER TABLE pools ALTER COLUMN collateral_small TYPE TEXT[] "
        "USING CASE WHEN collateral_small IS NOT NULL THEN ARRAY[collateral_small] ELSE NULL END"
    )


def downgrade():
    op.execute(
        "ALTER TABLE pools ALTER COLUMN collateral_large TYPE VARCHAR(20) "
        "USING collateral_large[1]"
    )
    op.execute(
        "ALTER TABLE pools ALTER COLUMN collateral_small TYPE VARCHAR(50) "
        "USING collateral_small[1]"
    )
