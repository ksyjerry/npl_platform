"""
Demo data seed script for NPL Platform.
Inserts realistic pools, companies, pool_companies, pool_participants, and bonds.

Usage: docker compose exec backend python seed_demo.py
"""

import asyncio
import json
import random
from datetime import date, datetime, timedelta

from sqlalchemy import text

from app.core.database import async_session


# ─── Company seed data ───────────────────────────────────────────────
SELLER_COMPANIES = [
    "우리은행", "신한은행", "KB국민은행", "하나은행", "SC제일은행",
    "한국산업은행", "IBK기업은행", "수협은행", "대구은행", "부산은행",
    "경남은행", "광주은행", "전북은행", "제주은행",
    "JB우리캐피탈", "KB캐피탈", "신한캐피탈", "하나캐피탈",
    "한국자산관리공사", "예금보험공사",
]

BUYER_COMPANIES = [
    "하나F&I", "우리F&I", "KB F&I", "대신F&I", "신한F&I",
    "키움투자자산운용", "마이다스에셋", "유진자산운용", "한국투자파트너스",
    "스카이레이크인베스트먼트", "인베스트코리아", "글로벌NPL파트너스",
    "동양자산운용", "에이치디자산", "코리아에셋투자증권",
]

# ─── Pool templates ──────────────────────────────────────────────────
POOL_TEMPLATES = [
    # (name_prefix, sale_method, collateral_large, collateral_small)
    ("PwC-KB", "공개입찰", ["담보"], ["Regular"]),
    ("PwC-SH", "공개입찰", ["담보", "무담보"], ["Regular", "CCRS"]),
    ("PwC-WR", "수의계약", ["무담보"], ["일반무담보"]),
    ("PwC-HN", "공개입찰", ["담보"], ["Regular", "IRL"]),
    ("PwC-SC", "공개입찰", ["담보", "무담보"], ["Special", "CCRS"]),
    ("PwC-IBK", "수의계약", ["담보"], ["Regular"]),
    ("PwC-SH2", "공개입찰", ["무담보"], ["CCRS", "일반무담보"]),
    ("PwC-KDB", "공개입찰", ["담보"], ["Regular", "Special"]),
    ("PwC-DG", "수의계약", ["담보", "무담보"], ["Regular", "기타"]),
    ("PwC-BS", "공개입찰", ["담보"], ["IRL"]),
    ("PwC-JB", "공개입찰", ["무담보"], ["일반무담보"]),
    ("PwC-GJ", "수의계약", ["담보"], ["CCRS"]),
    ("PwC-KB2", "공개입찰", ["담보", "무담보"], ["Regular", "CCRS", "IRL"]),
    ("PwC-WR2", "공개입찰", ["담보"], ["Special"]),
    ("PwC-HN2", "수의계약", ["무담보"], ["일반무담보", "기타"]),
]

DEBTOR_TYPES_OPTIONS = [
    ["개인"],
    ["법인"],
    ["개인", "법인"],
    ["개인", "개인사업자"],
    ["개인", "개인사업자", "법인"],
    ["법인", "개인사업자"],
]

ADVISORS = [
    "삼일PwC", "삼정KPMG", "딜로이트안진", "EY한영", "법무법인 김앤장",
    "법무법인 태평양", "법무법인 율촌", "법무법인 세종", None
]

CREDITOR_NAMES = [
    "우리은행", "신한은행", "KB국민은행", "하나은행", "SC제일은행",
    "한국산업은행", "IBK기업은행", "수협은행", "대구은행", "부산은행",
    "JB우리캐피탈", "KB캐피탈", "신한캐피탈", "하나캐피탈",
]

BOND_TYPE_COLLATERAL = {
    "A": None,  # 일반무담보
    "B1": "CCRS",
    "B2": "IRL",
    "C": None,  # 담보 - varied
}

COLLATERAL_TYPES_C = [
    "아파트", "다세대/다가구", "오피스텔", "상가", "토지",
    "근린생활시설", "공장", "사무실", "주택", "빌라",
]

PRODUCT_TYPES = [
    "주택담보대출", "신용대출", "기업대출", "할부금융", "리스",
    "카드론", "마이너스통장", "전세자금대출", "학자금대출",
]

LEGAL_STATUSES = [
    "정상", "연체", "회수의문", "추정손실", "상각", "가압류", "강제집행", None
]

ADDRESSES = [
    "서울특별시 강남구 역삼동 123-45",
    "서울특별시 서초구 서초동 456-78",
    "서울특별시 송파구 잠실동 789-12",
    "경기도 성남시 분당구 정자동 34-5",
    "경기도 수원시 팔달구 매산동 67-8",
    "부산광역시 해운대구 우동 90-12",
    "대구광역시 수성구 범어동 345-6",
    "인천광역시 남동구 구월동 78-9",
    "대전광역시 유성구 봉명동 12-3",
    "광주광역시 서구 치평동 45-6",
    "경기도 고양시 일산동구 마두동 78-9",
    "경기도 용인시 수지구 죽전동 12-3",
]


def random_date(start: date, end: date) -> date:
    delta = (end - start).days
    return start + timedelta(days=random.randint(0, delta))


def masked_id() -> str:
    """Generate a masked debtor ID like 800101-1******"""
    year = random.randint(60, 99) if random.random() < 0.7 else random.randint(0, 5)
    month = random.randint(1, 12)
    day = random.randint(1, 28)
    gender = random.choice([1, 2, 3, 4])
    return f"{year:02d}{month:02d}{day:02d}-{gender}******"


def corporate_id() -> str:
    """Generate a masked corporate ID like 110111-0******"""
    p1 = random.randint(100000, 999999)
    return f"{p1}-0******"


async def seed():
    async with async_session() as db:
        # ─── 1. Insert companies ──────────────────────────────────
        existing = await db.execute(text("SELECT name FROM companies"))
        existing_names = {r[0] for r in existing.all()}

        company_id_map = {}
        # Re-fetch existing company IDs
        for row in (await db.execute(text("SELECT id, name FROM companies"))).all():
            company_id_map[row[1]] = row[0]

        new_companies = []
        for name in SELLER_COMPANIES:
            if name not in existing_names:
                new_companies.append({"name": name, "type": "seller"})
        for name in BUYER_COMPANIES:
            if name not in existing_names:
                new_companies.append({"name": name, "type": "buyer"})

        if new_companies:
            for c in new_companies:
                result = await db.execute(
                    text("INSERT INTO companies (name, type, created_at) VALUES (:name, :type, NOW()) RETURNING id"),
                    c,
                )
                company_id_map[c["name"]] = result.scalar_one()

        print(f"Companies: {len(company_id_map)} total ({len(new_companies)} new)")

        # Get admin user ID for created_by
        admin_row = await db.execute(text("SELECT id FROM users WHERE role='admin' LIMIT 1"))
        admin_id = admin_row.scalar_one_or_none() or 1

        # ─── 2. Insert pools ─────────────────────────────────────
        existing_pools = await db.execute(text("SELECT name FROM pools"))
        existing_pool_names = {r[0] for r in existing_pools.all()}

        pool_configs = []
        base_date = date(2024, 1, 1)
        now = date(2026, 3, 15)

        for i, tmpl in enumerate(POOL_TEMPLATES):
            prefix, sale_method, coll_lg, coll_sm = tmpl
            year = random.choice([2024, 2025, 2026])
            quarter = random.randint(1, 4)
            pool_name = f"{prefix} {year}-{quarter} Program"

            if pool_name in existing_pool_names:
                pool_name = f"{prefix} {year}-{quarter}A Program"
                if pool_name in existing_pool_names:
                    continue

            # Determine status
            if i < 5:
                status = "active"
            elif i < 12:
                status = "closed"
            else:
                status = "cancelled"

            cutoff = random_date(date(year, 1, 1), min(date(year, 12, 31), now))
            bid_date = cutoff + timedelta(days=random.randint(14, 45))
            closing_date = bid_date + timedelta(days=random.randint(7, 30)) if status in ("closed",) else None

            debtor_type = random.choice(DEBTOR_TYPES_OPTIONS)
            debtor_count = random.randint(50, 3000)
            bond_count = random.randint(debtor_count, debtor_count * 3)
            avg_overdue = round(random.uniform(6, 60), 1)
            opb = random.randint(5_000_000_000, 500_000_000_000)  # 50억 ~ 5000억

            if status == "closed":
                sale_price = int(opb * random.uniform(0.03, 0.25))
                bidder_count = random.randint(2, 8)
            else:
                sale_price = None
                bidder_count = random.randint(3, 12) if status == "active" else None

            resale_included = random.random() < 0.4
            resale_debtor = random.randint(5, debtor_count // 5) if resale_included else None
            resale_bond = random.randint(resale_debtor or 1, (resale_debtor or 1) * 2) if resale_included else None
            resale_opb = int(opb * random.uniform(0.05, 0.2)) if resale_included else None

            pool_configs.append({
                "name": pool_name,
                "status": status,
                "collateral_large": coll_lg,
                "collateral_small": coll_sm,
                "cutoff_date": cutoff,
                "bid_date": bid_date,
                "closing_date": closing_date,
                "sale_method": sale_method,
                "bidder_count": bidder_count,
                "debtor_type": debtor_type,
                "debtor_count": debtor_count,
                "bond_count": bond_count,
                "avg_overdue_months": avg_overdue,
                "opb": opb,
                "sale_price": sale_price,
                "resale_included": resale_included,
                "resale_debtor_count": resale_debtor,
                "resale_bond_count": resale_bond,
                "resale_opb": resale_opb,
                "remarks": random.choice([None, "특이사항 없음", "재매각 채권 포함", "대규모 포트폴리오"]),
                "created_by": admin_id,
                # For linking later
                "_sellers": [],
                "_buyers": [],
            })

        # Assign sellers and buyers to pools
        seller_names = [n for n in SELLER_COMPANIES if n in company_id_map]
        buyer_names = [n for n in BUYER_COMPANIES if n in company_id_map]

        for cfg in pool_configs:
            num_sellers = random.randint(1, 3)
            num_buyers = random.randint(1, 4)
            cfg["_sellers"] = random.sample(seller_names, min(num_sellers, len(seller_names)))
            cfg["_buyers"] = random.sample(buyer_names, min(num_buyers, len(buyer_names)))

        # Insert pools
        new_pool_ids = []
        for cfg in pool_configs:
            sellers = cfg.pop("_sellers")
            buyers = cfg.pop("_buyers")
            result = await db.execute(
                text("""
                    INSERT INTO pools (
                        name, status, collateral_large, collateral_small,
                        cutoff_date, bid_date, closing_date, sale_method, bidder_count,
                        debtor_type, debtor_count, bond_count, avg_overdue_months,
                        opb, sale_price,
                        resale_included, resale_debtor_count, resale_bond_count, resale_opb,
                        remarks, created_by, created_at
                    ) VALUES (
                        :name, :status, :collateral_large, :collateral_small,
                        :cutoff_date, :bid_date, :closing_date, :sale_method, :bidder_count,
                        :debtor_type, :debtor_count, :bond_count, :avg_overdue_months,
                        :opb, :sale_price,
                        :resale_included, :resale_debtor_count, :resale_bond_count, :resale_opb,
                        :remarks, :created_by, NOW()
                    ) RETURNING id
                """),
                cfg,
            )
            pool_id = result.scalar_one()
            new_pool_ids.append((pool_id, cfg["status"], sellers, buyers))

        print(f"Pools: {len(new_pool_ids)} new pools inserted")

        # ─── 3. Insert pool_companies & pool_participants ─────────
        pc_count = 0
        pp_count = 0
        for pool_id, status, sellers, buyers in new_pool_ids:
            for seller_name in sellers:
                cid = company_id_map[seller_name]
                await db.execute(
                    text("INSERT INTO pool_companies (pool_id, company_id, role, advisor) VALUES (:pid, :cid, 'seller', :adv)"),
                    {"pid": pool_id, "cid": cid, "adv": random.choice(ADVISORS)},
                )
                pc_count += 1
                # Add participants for closed/cancelled pools
                if status in ("closed", "cancelled"):
                    await db.execute(
                        text("INSERT INTO pool_participants (pool_id, company_id, participated_at) VALUES (:pid, :cid, NOW()) ON CONFLICT DO NOTHING"),
                        {"pid": pool_id, "cid": cid},
                    )
                    pp_count += 1

            for buyer_name in buyers:
                cid = company_id_map[buyer_name]
                checklist = random.choice([True, False, None])
                await db.execute(
                    text("INSERT INTO pool_companies (pool_id, company_id, role, advisor, buyer_checklist_ok) VALUES (:pid, :cid, 'buyer', :adv, :chk)"),
                    {"pid": pool_id, "cid": cid, "adv": random.choice(ADVISORS), "chk": checklist},
                )
                pc_count += 1
                if status in ("closed", "cancelled"):
                    await db.execute(
                        text("INSERT INTO pool_participants (pool_id, company_id, participated_at) VALUES (:pid, :cid, NOW()) ON CONFLICT DO NOTHING"),
                        {"pid": pool_id, "cid": cid},
                    )
                    pp_count += 1

            # Also add accountant companies as participants
            for acc_name in ["삼일회계법인", "삼일PwC"]:
                if acc_name in company_id_map:
                    await db.execute(
                        text("INSERT INTO pool_participants (pool_id, company_id, participated_at) VALUES (:pid, :cid, NOW()) ON CONFLICT DO NOTHING"),
                        {"pid": pool_id, "cid": company_id_map[acc_name]},
                    )

        print(f"Pool companies: {pc_count}, Pool participants: {pp_count}")

        # ─── 4. Insert bonds (large volume) ──────────────────────
        # Also add bonds to existing pools (1, 2, 3)
        all_pool_ids = [(pid, st) for pid, st, _, _ in new_pool_ids]
        # Add existing pools
        for row in (await db.execute(text("SELECT id, status FROM pools WHERE id <= 3"))).all():
            all_pool_ids.append((row[0], row[1]))

        bond_values = []
        batch_ts = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        total_bonds = 0

        for pool_id, status in all_pool_ids:
            # Each pool gets 30-80 bonds
            num_bonds = random.randint(30, 80)
            pool_creditors = random.sample(CREDITOR_NAMES, min(random.randint(1, 4), len(CREDITOR_NAMES)))

            for j in range(num_bonds):
                bond_type = random.choice(["A", "B1", "B2", "C"])
                debtor_type = random.choice(["개인", "개인사업자", "법인"])
                creditor = random.choice(pool_creditors)

                if debtor_type == "법인":
                    did = corporate_id()
                else:
                    did = masked_id()

                opb = random.randint(500_000, 2_000_000_000)  # 50만 ~ 20억
                original = int(opb * random.uniform(1.0, 3.0))
                interest = int(opb * random.uniform(0.05, 0.5))
                total_bal = opb + interest
                overdue_start = random_date(date(2018, 1, 1), date(2025, 6, 30))
                overdue_months = (date(2026, 3, 15) - overdue_start).days // 30
                transfer_count = random.choices([0, 1, 2, 3], weights=[60, 25, 10, 5])[0]

                # Collateral type for type C
                if bond_type == "C":
                    coll_type = random.choice(COLLATERAL_TYPES_C)
                    coll_addr = random.choice(ADDRESSES)
                    product = random.choice(["주택담보대출", "기업대출", "전세자금대출"])
                elif bond_type == "A":
                    coll_type = None
                    coll_addr = None
                    product = random.choice(["신용대출", "카드론", "마이너스통장", "학자금대출"])
                else:
                    coll_type = BOND_TYPE_COLLATERAL.get(bond_type)
                    coll_addr = random.choice(ADDRESSES) if bond_type == "B2" else None
                    product = random.choice(PRODUCT_TYPES)

                # Extra data varies by type
                extra = {}
                if bond_type == "A":
                    extra = {
                        "상각여부": random.choice(["Y", "N"]),
                        "상각일자": str(random_date(date(2020, 1, 1), date(2025, 12, 31))) if random.random() < 0.3 else None,
                        "연체시작일": str(overdue_start),
                    }
                elif bond_type == "B1":
                    extra = {
                        "CCRS등급": random.choice(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]),
                        "CCRS점수": random.randint(200, 900),
                        "상각여부": random.choice(["Y", "N"]),
                        "보증유형": random.choice(["신용보증기금", "기술보증기금", "없음"]),
                    }
                elif bond_type == "B2":
                    extra = {
                        "IRL등급": random.choice(["AAA", "AA", "A", "BBB", "BB", "B", "CCC"]),
                        "감정가": random.randint(50_000_000, 5_000_000_000),
                        "LTV": round(random.uniform(0.3, 0.9), 2),
                        "상각여부": random.choice(["Y", "N"]),
                    }
                elif bond_type == "C":
                    extra = {
                        "감정가": random.randint(50_000_000, 5_000_000_000),
                        "LTV": round(random.uniform(0.3, 0.95), 2),
                        "근저당설정액": random.randint(30_000_000, 3_000_000_000),
                        "선순위채권액": random.randint(0, 500_000_000),
                        "상각여부": random.choice(["Y", "N"]),
                    }

                bond_no = f"B{pool_id:03d}-{bond_type}-{j+1:04d}"

                bond_values.append({
                    "pool_id": pool_id,
                    "bond_type": bond_type,
                    "bond_no": bond_no,
                    "debtor_type": debtor_type,
                    "debtor_id_masked": did,
                    "creditor": creditor,
                    "product_type": product,
                    "collateral_type": coll_type,
                    "collateral_address": coll_addr,
                    "original_amount": original,
                    "opb": opb,
                    "interest_balance": interest,
                    "total_balance": total_bal,
                    "overdue_start_date": overdue_start,
                    "overdue_months": overdue_months,
                    "legal_status": random.choice(LEGAL_STATUSES),
                    "transfer_count": transfer_count,
                    "extra_data": json.dumps(extra, ensure_ascii=False) if extra else None,
                    "import_batch": f"seed_{batch_ts}",
                    "created_by": admin_id,
                    "is_deleted": False,
                })
                total_bonds += 1

        # Batch insert bonds (50 at a time)
        batch_size = 50
        for i in range(0, len(bond_values), batch_size):
            batch = bond_values[i:i + batch_size]
            for b in batch:
                await db.execute(
                    text("""
                        INSERT INTO bonds (
                            pool_id, bond_type, bond_no, debtor_type, debtor_id_masked,
                            creditor, product_type, collateral_type, collateral_address,
                            original_amount, opb, interest_balance, total_balance,
                            overdue_start_date, overdue_months, legal_status,
                            transfer_count, extra_data, import_batch, created_by, is_deleted, created_at
                        ) VALUES (
                            :pool_id, :bond_type, :bond_no, :debtor_type, :debtor_id_masked,
                            :creditor, :product_type, :collateral_type, :collateral_address,
                            :original_amount, :opb, :interest_balance, :total_balance,
                            :overdue_start_date, :overdue_months, :legal_status,
                            :transfer_count, CAST(:extra_data AS jsonb), :import_batch, :created_by, :is_deleted, NOW()
                        )
                    """),
                    b,
                )

        print(f"Bonds: {total_bonds} inserted across {len(all_pool_ids)} pools")

        # ─── 5. Also add pool_companies for existing pools (1,2,3) if missing
        existing_pc = await db.execute(text("SELECT pool_id FROM pool_companies WHERE pool_id <= 3"))
        if not existing_pc.all():
            # Pool 1 (active)
            if "OO저축은행" in company_id_map:
                await db.execute(text(
                    "INSERT INTO pool_companies (pool_id, company_id, role, advisor) VALUES (1, :cid, 'seller', '삼일PwC')"
                ), {"cid": company_id_map["OO저축은행"]})
            if "우리은행" in company_id_map:
                await db.execute(text(
                    "INSERT INTO pool_companies (pool_id, company_id, role, advisor) VALUES (1, :cid, 'seller', '법무법인 김앤장')"
                ), {"cid": company_id_map["우리은행"]})
            if "OO F&I" in company_id_map:
                await db.execute(text(
                    "INSERT INTO pool_companies (pool_id, company_id, role, buyer_checklist_ok) VALUES (1, :cid, 'buyer', true)"
                ), {"cid": company_id_map["OO F&I"]})
            if "하나F&I" in company_id_map:
                await db.execute(text(
                    "INSERT INTO pool_companies (pool_id, company_id, role, buyer_checklist_ok) VALUES (1, :cid, 'buyer', false)"
                ), {"cid": company_id_map["하나F&I"]})

            # Pool 2 (closed)
            if "신한은행" in company_id_map:
                await db.execute(text(
                    "INSERT INTO pool_companies (pool_id, company_id, role, advisor) VALUES (2, :cid, 'seller', '딜로이트안진')"
                ), {"cid": company_id_map["신한은행"]})
                await db.execute(text(
                    "INSERT INTO pool_participants (pool_id, company_id, participated_at) VALUES (2, :cid, NOW()) ON CONFLICT DO NOTHING"
                ), {"cid": company_id_map["신한은행"]})
            if "KB F&I" in company_id_map:
                await db.execute(text(
                    "INSERT INTO pool_companies (pool_id, company_id, role, buyer_checklist_ok) VALUES (2, :cid, 'buyer', true)"
                ), {"cid": company_id_map["KB F&I"]})
                await db.execute(text(
                    "INSERT INTO pool_participants (pool_id, company_id, participated_at) VALUES (2, :cid, NOW()) ON CONFLICT DO NOTHING"
                ), {"cid": company_id_map["KB F&I"]})

            # Pool 3 (cancelled)
            if "하나은행" in company_id_map:
                await db.execute(text(
                    "INSERT INTO pool_companies (pool_id, company_id, role, advisor) VALUES (3, :cid, 'seller', 'EY한영')"
                ), {"cid": company_id_map["하나은행"]})
                await db.execute(text(
                    "INSERT INTO pool_participants (pool_id, company_id, participated_at) VALUES (3, :cid, NOW()) ON CONFLICT DO NOTHING"
                ), {"cid": company_id_map["하나은행"]})

            print("Pool companies/participants added for existing pools 1,2,3")

        await db.commit()
        print("\n✓ Seed complete!")

        # Print summary
        for table in ["companies", "pools", "pool_companies", "pool_participants", "bonds"]:
            count = (await db.execute(text(f"SELECT COUNT(*) FROM {table}"))).scalar()
            print(f"  {table}: {count} rows")


if __name__ == "__main__":
    asyncio.run(seed())
