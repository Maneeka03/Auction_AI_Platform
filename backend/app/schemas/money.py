from decimal import Decimal
from typing import Annotated

from pydantic import Field

# Mirrors the Numeric(12, 2) money columns, so an amount the database would silently round is
# rejected at the edge instead.
Money = Annotated[Decimal, Field(gt=0, max_digits=12, decimal_places=2)]
