"""dynamic category fields: per-category custom fields, property attributes, and a seeded taxonomy"""

import re
import uuid

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "0021"
down_revision = "0020"
branch_labels = None
depends_on = None

field_type_enum = postgresql.ENUM(
    "text", "textarea", "number", "select", "boolean", "date", name="category_field_type"
)


def slugify(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


# group -> main category -> {subs: [...], fields: [(label, type, options|None, unit|None), ...]}
TAXONOMY: dict[str, dict[str, dict]] = {
    "Consumer Goods, Luxury & Collectibles": {
        "Jewellery & Timepieces": {
            "subs": ["Rings", "Necklaces", "Bracelets", "Earrings", "Loose Gemstones", "Luxury Watches", "Vintage Pocket Watches", "Brooches"],
            "fields": [
                ("Material", "select", ["18K Gold", "22K Gold", "Platinum", "White Gold", "Rose Gold", "Silver", "Other"], None),
                ("Gemstone", "text", None, None),
                ("Carat", "number", None, "ct"),
                ("Gross Weight", "number", None, "g"),
                ("Brand / Maker", "text", None, None),
                ("Certification", "select", ["GIA", "IGI", "None", "Other"], None),
                ("Condition", "select", ["New", "Excellent", "Good", "Fair"], None),
            ],
        },
        "Fine Art & Sculpture": {
            "subs": ["Oil Paintings", "Watercolours", "Sculptures", "Limited Edition Prints", "Photography", "Street Art", "Mixed Media"],
            "fields": [
                ("Artist", "text", None, None),
                ("Medium", "select", ["Oil", "Watercolour", "Acrylic", "Bronze", "Marble", "Print", "Photograph", "Mixed Media"], None),
                ("Dimensions (H x W x D)", "text", None, None),
                ("Year Created", "number", None, None),
                ("Signed", "boolean", None, None),
                ("Edition Number", "text", None, None),
                ("Provenance", "textarea", None, None),
            ],
        },
        "Antiques & Period Furniture": {
            "subs": ["Mid-Century Modern", "Victorian Furniture", "Porcelain & Ceramics", "Glassware", "Silverware", "Chandeliers", "Clocks"],
            "fields": [
                ("Period", "select", ["Victorian", "Mid-Century Modern", "Art Deco", "Georgian", "Edwardian", "Other"], None),
                ("Material", "text", None, None),
                ("Origin", "text", None, None),
                ("Dimensions", "text", None, None),
                ("Age / Year", "text", None, None),
                ("Restored", "boolean", None, None),
                ("Condition", "select", ["Excellent", "Good", "Fair"], None),
            ],
        },
        "Fashion & Luxury Accessories": {
            "subs": ["Designer Handbags", "Haute Couture", "Vintage Clothing", "Luxury Shoes", "Belts", "Scarves", "Fine Fur"],
            "fields": [
                ("Brand", "text", None, None),
                ("Size", "text", None, None),
                ("Material", "text", None, None),
                ("Colour", "text", None, None),
                ("Condition", "select", ["New with tags", "Excellent", "Good", "Fair"], None),
                ("Serial / Authenticity", "text", None, None),
                ("Collection / Year", "text", None, None),
            ],
        },
        "Coins & Currency (Numismatics)": {
            "subs": ["Gold Bullion", "Rare Coins", "Banknotes", "Ancient Coins", "Commemorative Medals", "Tokens"],
            "fields": [
                ("Denomination", "text", None, None),
                ("Mint Year", "number", None, None),
                ("Country / Mint", "text", None, None),
                ("Metal", "select", ["Gold", "Silver", "Copper", "Nickel", "Bronze", "Other"], None),
                ("Grade", "text", None, None),
                ("Grading Service", "select", ["PCGS", "NGC", "None"], None),
                ("Weight", "number", None, "g"),
            ],
        },
        "Stamps & Postal History": {
            "subs": ["Rare Stamps", "First Day Covers", "Postal Stationery", "Revenue Stamps", "Historical Letters"],
            "fields": [
                ("Country", "text", None, None),
                ("Year of Issue", "number", None, None),
                ("Denomination", "text", None, None),
                ("Condition", "select", ["Mint", "Used", "Fine", "Fair"], None),
                ("Certification", "text", None, None),
                ("Perforation / Watermark", "text", None, None),
            ],
        },
        "Sports Memorabilia & Cards": {
            "subs": ["Trading Cards (PSA graded)", "Match-Worn Jerseys", "Autographed Equipment", "Ticket Stubs", "Vintage Programs"],
            "fields": [
                ("Sport", "select", ["Football", "Basketball", "Baseball", "Soccer", "Cricket", "Other"], None),
                ("Player / Team", "text", None, None),
                ("Year / Season", "text", None, None),
                ("Grading", "select", ["PSA", "BGS", "SGC", "Ungraded"], None),
                ("Grade Score", "number", None, None),
                ("Autographed", "boolean", None, None),
            ],
        },
        "Toys, Dolls & Pop Culture": {
            "subs": ["Vintage Action Figures", "Model Trains", "Die-Cast Vehicles", "Comic Books", "Retro Video Games", "Board Games"],
            "fields": [
                ("Franchise / Brand", "text", None, None),
                ("Year / Era", "text", None, None),
                ("Condition", "select", ["Mint in Box", "Opened", "Used"], None),
                ("Original Packaging", "boolean", None, None),
                ("Scale / Size", "text", None, None),
                ("Material", "text", None, None),
            ],
        },
        "Entertainment & Historical": {
            "subs": ["Movie Props", "Autographs", "Musical Instruments", "Rare Books", "Historical Documents", "Maps", "Militaria"],
            "fields": [
                ("Type", "select", ["Prop", "Autograph", "Instrument", "Book", "Document", "Map", "Militaria"], None),
                ("Year / Date", "text", None, None),
                ("Authenticity (COA)", "boolean", None, None),
                ("Notable Association", "text", None, None),
                ("Provenance", "textarea", None, None),
            ],
        },
    },
    "Vehicles & Transportation": {
        "Passenger Vehicles": {
            "subs": ["Sedans", "SUVs", "Coupes", "Hatchbacks", "Electric Vehicles (EVs)", "Hybrid Cars", "Convertibles"],
            "fields": [
                ("Make", "text", None, None),
                ("Model", "text", None, None),
                ("Year", "number", None, None),
                ("Mileage", "number", None, "mi"),
                ("Fuel Type", "select", ["Petrol", "Diesel", "Electric", "Hybrid"], None),
                ("Transmission", "select", ["Automatic", "Manual"], None),
                ("VIN", "text", None, None),
                ("Exterior Colour", "text", None, None),
                ("Title Status", "select", ["Clean", "Salvage", "Rebuilt"], None),
            ],
        },
        "Classic & Exotic Cars": {
            "subs": ["Vintage Cars", "Muscle Cars", "Supercars", "Hot Rods", "Restomod Vehicles"],
            "fields": [
                ("Make", "text", None, None),
                ("Model", "text", None, None),
                ("Year", "number", None, None),
                ("Mileage", "number", None, "mi"),
                ("Engine", "text", None, None),
                ("Matching Numbers", "boolean", None, None),
                ("Restored", "boolean", None, None),
                ("VIN", "text", None, None),
                ("Condition", "select", ["Concours", "Excellent", "Driver", "Project"], None),
            ],
        },
        "Motorcycles & Powersports": {
            "subs": ["Sportbikes", "Cruisers", "Dirt Bikes", "ATVs", "UVs", "Jet Skis", "Snowmobiles"],
            "fields": [
                ("Make", "text", None, None),
                ("Model", "text", None, None),
                ("Year", "number", None, None),
                ("Mileage / Hours", "number", None, None),
                ("Engine Size", "number", None, "cc"),
                ("Type", "select", ["Sportbike", "Cruiser", "Dirt Bike", "ATV", "Jet Ski", "Snowmobile"], None),
                ("Title Status", "select", ["Clean", "Salvage", "Rebuilt"], None),
            ],
        },
        "Commercial Trucks & Vans": {
            "subs": ["Semi-Trucks", "Box Trucks", "Cargo Vans", "Dump Trucks", "Flatbed Trucks"],
            "fields": [
                ("Make", "text", None, None),
                ("Model", "text", None, None),
                ("Year", "number", None, None),
                ("Mileage", "number", None, "mi"),
                ("GVWR", "number", None, "lbs"),
                ("Engine", "text", None, None),
                ("Transmission", "select", ["Automatic", "Manual"], None),
                ("VIN", "text", None, None),
            ],
        },
        "Trailers & Towing": {
            "subs": ["Enclosed Trailers", "Utility Trailers", "Flatbed Trailers", "Livestock Trailers", "Car Haulers"],
            "fields": [
                ("Type", "select", ["Enclosed", "Utility", "Flatbed", "Livestock", "Car Hauler"], None),
                ("Length", "number", None, "ft"),
                ("Axles", "number", None, None),
                ("Load Capacity", "number", None, "lbs"),
                ("Year", "number", None, None),
                ("VIN / Serial", "text", None, None),
            ],
        },
        "Marine & Aviation": {
            "subs": ["Motorboats", "Sailboats", "Yachts", "Jet Boats", "Light Aircraft", "Helicopters", "Marine Engines"],
            "fields": [
                ("Type", "select", ["Motorboat", "Sailboat", "Yacht", "Jet Boat", "Aircraft", "Helicopter"], None),
                ("Builder", "text", None, None),
                ("Model", "text", None, None),
                ("Year", "number", None, None),
                ("Length", "number", None, "ft"),
                ("Engine / Hours", "text", None, None),
                ("Hull ID / Registration", "text", None, None),
            ],
        },
    },
    "Industrial, Machinery & Business Assets": {
        "Construction Equipment": {
            "subs": ["Excavators", "Bulldozers", "Skid Steers", "Backhoes", "Forklifts", "Cranes", "Scissor Lifts"],
            "fields": [
                ("Type", "select", ["Excavator", "Bulldozer", "Skid Steer", "Backhoe", "Forklift", "Crane", "Scissor Lift"], None),
                ("Make", "text", None, None),
                ("Model", "text", None, None),
                ("Year", "number", None, None),
                ("Operating Hours", "number", None, "hrs"),
                ("Serial Number", "text", None, None),
                ("Condition", "select", ["Operational", "Needs Repair"], None),
            ],
        },
        "Agricultural Machinery": {
            "subs": ["Tractors", "Combines", "Balers", "Seeders", "Plows", "Irrigation Equipment"],
            "fields": [
                ("Type", "select", ["Tractor", "Combine", "Baler", "Seeder", "Plow", "Irrigation"], None),
                ("Make", "text", None, None),
                ("Model", "text", None, None),
                ("Year", "number", None, None),
                ("Engine Hours", "number", None, "hrs"),
                ("Horsepower", "number", None, "hp"),
                ("Serial Number", "text", None, None),
            ],
        },
        "Manufacturing & Metalworking": {
            "subs": ["CNC Machines", "Lathes", "Milling Machines", "Welding Equipment", "Injection Moulders"],
            "fields": [
                ("Machine Type", "select", ["CNC", "Lathe", "Milling", "Welding", "Injection Moulder"], None),
                ("Make", "text", None, None),
                ("Model", "text", None, None),
                ("Year", "number", None, None),
                ("Operating Hours", "number", None, "hrs"),
                ("Power Requirement", "text", None, None),
                ("Serial Number", "text", None, None),
            ],
        },
        "Restaurant & Catering": {
            "subs": ["Commercial Ovens", "Walk-in Freezers", "Stainless Steel Tables", "Ice Machines", "Espresso Grinders"],
            "fields": [
                ("Equipment Type", "text", None, None),
                ("Brand", "text", None, None),
                ("Model", "text", None, None),
                ("Year", "number", None, None),
                ("Power", "select", ["Electric", "Gas", "Both"], None),
                ("Dimensions", "text", None, None),
                ("Condition", "select", ["New", "Excellent", "Good", "Fair"], None),
            ],
        },
        "Medical & Laboratory": {
            "subs": ["Ultrasound Machines", "MRI Scanners", "Lab Centrifuges", "Dental Chairs", "Surgical Tools"],
            "fields": [
                ("Equipment Type", "text", None, None),
                ("Manufacturer", "text", None, None),
                ("Model", "text", None, None),
                ("Year", "number", None, None),
                ("Serial Number", "text", None, None),
                ("Certification / Compliance", "text", None, None),
                ("Condition", "select", ["New", "Excellent", "Good", "Fair"], None),
            ],
        },
        "IT & Office Liquidations": {
            "subs": ["Servers", "Network Switches", "Laptops", "Office Desks", "Ergonomic Chairs", "Copiers"],
            "fields": [
                ("Item Type", "select", ["Server", "Switch", "Laptop", "Desk", "Chair", "Copier"], None),
                ("Brand", "text", None, None),
                ("Model", "text", None, None),
                ("Quantity", "number", None, None),
                ("Specifications", "textarea", None, None),
                ("Condition", "select", ["New", "Refurbished", "Used"], None),
            ],
        },
    },
    "Real Estate & Land": {
        "Residential Real Estate": {
            "subs": ["Single-Family Homes", "Condos", "Apartments", "Townhouses", "Luxury Estates"],
            "fields": [
                ("Property Type", "select", ["Single-Family", "Condo", "Apartment", "Townhouse", "Estate"], None),
                ("Bedrooms", "number", None, None),
                ("Bathrooms", "number", None, None),
                ("Area", "number", None, "sqft"),
                ("Lot Size", "number", None, "sqft"),
                ("Year Built", "number", None, None),
                ("Parking", "number", None, None),
                ("Furnished", "boolean", None, None),
            ],
        },
        "Commercial Real Estate": {
            "subs": ["Office Buildings", "Retail Spaces", "Warehouses", "Hotels", "Strip Malls"],
            "fields": [
                ("Property Type", "select", ["Office", "Retail", "Warehouse", "Hotel", "Strip Mall"], None),
                ("Floor Area", "number", None, "sqft"),
                ("Lot Size", "number", None, "sqft"),
                ("Year Built", "number", None, None),
                ("Zoning", "text", None, None),
                ("Parking Spaces", "number", None, None),
                ("Tenanted", "boolean", None, None),
            ],
        },
        "Land & Acreage": {
            "subs": ["Agricultural Farmland", "Hunting Land", "Residential Lots", "Commercial Development Plots"],
            "fields": [
                ("Land Type", "select", ["Agricultural", "Hunting", "Residential Lot", "Commercial Plot"], None),
                ("Acreage", "number", None, "acres"),
                ("Zoning", "text", None, None),
                ("Road Access", "boolean", None, None),
                ("Utilities Available", "boolean", None, None),
                ("Topography", "text", None, None),
            ],
        },
        "Distressed Property": {
            "subs": ["Bank Foreclosures", "Tax Lien Properties", "Short Sales", "Fixer-Uppers"],
            "fields": [
                ("Distress Type", "select", ["Foreclosure", "Tax Lien", "Short Sale", "Fixer-Upper"], None),
                ("Property Type", "text", None, None),
                ("Bedrooms", "number", None, None),
                ("Bathrooms", "number", None, None),
                ("Area", "number", None, "sqft"),
                ("Year Built", "number", None, None),
                ("Estimated Repairs", "number", None, "$"),
                ("Occupancy", "select", ["Vacant", "Occupied"], None),
            ],
        },
    },
}


def upgrade() -> None:
    op.add_column("categories", sa.Column("group_label", sa.String(120)))
    op.add_column(
        "properties",
        sa.Column("attributes", postgresql.JSONB, nullable=False, server_default=sa.text("'{}'::jsonb")),
    )
    op.create_table(
        "category_fields",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("category_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("categories.id", ondelete="CASCADE"), nullable=False),
        sa.Column("label", sa.String(120), nullable=False),
        sa.Column("field_key", sa.String(140), nullable=False),
        sa.Column("field_type", field_type_enum, nullable=False),
        sa.Column("options", postgresql.JSON),
        sa.Column("unit", sa.String(40)),
        sa.Column("required", sa.Boolean, nullable=False, server_default=sa.false()),
        sa.Column("sort_order", sa.Integer, nullable=False, server_default="0"),
    )
    op.create_index("ix_category_fields_category_id", "category_fields", ["category_id"])

    categories = sa.table(
        "categories",
        sa.column("id", postgresql.UUID(as_uuid=True)),
        sa.column("name", sa.String),
        sa.column("slug", sa.String),
        sa.column("parent_id", postgresql.UUID(as_uuid=True)),
        sa.column("group_label", sa.String),
    )
    fields = sa.table(
        "category_fields",
        sa.column("id", postgresql.UUID(as_uuid=True)),
        sa.column("category_id", postgresql.UUID(as_uuid=True)),
        sa.column("label", sa.String),
        sa.column("field_key", sa.String),
        sa.column("field_type", field_type_enum),
        sa.column("options", postgresql.JSON),
        sa.column("unit", sa.String),
        sa.column("required", sa.Boolean),
        sa.column("sort_order", sa.Integer),
    )

    cat_rows: list[dict] = []
    field_rows: list[dict] = []
    for group, mains in TAXONOMY.items():
        for main_name, cfg in mains.items():
            main_id = uuid.uuid4()
            cat_rows.append({"id": main_id, "name": main_name, "slug": slugify(main_name), "parent_id": None, "group_label": group})
            for sub in cfg["subs"]:
                cat_rows.append({"id": uuid.uuid4(), "name": sub, "slug": slugify(sub), "parent_id": main_id, "group_label": None})
            for i, (label, ftype, options, unit) in enumerate(cfg["fields"]):
                field_rows.append({"id": uuid.uuid4(), "category_id": main_id, "label": label, "field_key": slugify(label), "field_type": ftype, "options": options, "unit": unit, "required": False, "sort_order": i})
    # Reserved fallback the seller picks when nothing fits; carries no fields.
    cat_rows.append({"id": uuid.uuid4(), "name": "Others", "slug": "others", "parent_id": None, "group_label": None})

    op.bulk_insert(categories, cat_rows)
    op.bulk_insert(fields, field_rows)


def downgrade() -> None:
    # Seeded main categories carry a group_label; deleting them cascades to their subs and fields.
    # The two original categories (Residential/Commercial, group_label NULL) are left untouched.
    op.execute("DELETE FROM categories WHERE group_label IS NOT NULL OR slug = 'others'")
    op.drop_index("ix_category_fields_category_id", "category_fields")
    op.drop_table("category_fields")
    op.drop_column("properties", "attributes")
    op.drop_column("categories", "group_label")
    field_type_enum.drop(op.get_bind(), checkfirst=True)
