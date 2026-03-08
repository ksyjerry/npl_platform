"""glossary seed data

Revision ID: 002_glossary_seed
Revises: 035d4db170cd
Create Date: 2026-03-08
"""
from alembic import op

revision = '002_glossary_seed'
down_revision = '035d4db170cd'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("""
        INSERT INTO glossary (term, definition, sort_order) VALUES
        ('NPL (Non-Performing Loan)',
         '금융기관의 부실채권. 원금 또는 이자가 3개월 이상 연체되어 정상적인 회수가 어려운 대출채권.',
         1),
        ('자산확정일 (Cut-off Date)',
         '매각 대상 채권을 확정하는 기준일. 이 날짜 기준으로 OPB(원금잔액)와 채권 정보를 산정한다.',
         2),
        ('매각대상자산',
         '금융기관이 매각하고자 하는 NPL 채권 묶음(Pool). 무담보·담보·PF 등 다양한 유형을 포함한다.',
         3),
        ('Data Disk',
         'Pool에 포함된 개별 채권 정보를 담은 원천 데이터. 차주 정보, 채권 잔액, 담보 정보 등이 포함된다.',
         4),
        ('Invitation Letter (IL)',
         '삼일PwC가 적격 투자자에게 입찰 참여를 공식 초청하는 문서. IL 수령 후 NDA 체결 절차가 진행된다.',
         5),
        ('입찰참가의향서 (LOI)',
         '투자자가 특정 Pool 입찰에 참여하겠다는 의향을 공식 표명하는 문서.',
         6),
        ('비밀유지서약서 (NDA)',
         '투자자가 Data Disk 열람 전 체결하는 기밀 유지 약정서. NDA 체결 후 자료 접근이 허용된다.',
         7),
        ('적격 투자자',
         '삼일PwC가 정한 기준(자산 규모, NPL 투자 경험 등)을 충족하여 입찰 참여 자격이 인정된 기관 투자자.',
         8),
        ('Bid Package',
         '입찰 참가자에게 제공되는 입찰 자료 묶음. Data Disk, LSPA 초안, 입찰 지침서 등이 포함된다.',
         9),
        ('자산양수도계약서 (LSPA)',
         'Loan Sale and Purchase Agreement. NPL 채권의 매각·인수를 확정하는 최종 계약서.',
         10),
        ('Interim',
         '거래 종결 전 과도기(중간 정산) 기간. 자산확정일 이후 거래 종결일까지의 이자·원금 변동을 처리한다.',
         11)
    """)


def downgrade():
    op.execute("DELETE FROM glossary")
