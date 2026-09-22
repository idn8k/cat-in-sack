# CatOps

CatOps is a household cat-care logistics app: tracking vet/grooming/daycare visits, weight history, and supply inventory for one or more cats in a household.

## Language

**User**:
An account holder, identified by email, who logs in via OTP. Belongs to exactly one Household.

**Household**:
The shared workspace that owns a Household's Felines, Events, and Inventory. Created automatically at signup; MVP restricts it to one User, but the schema anticipates multi-user sharing later.
_Avoid_: Account, workspace

**Feline**:
A cat profile — name, date of birth, breed, target weight, dietary restrictions. Belongs to one Household; a Household may have multiple Felines.
_Avoid_: Pet (use Feline for the domain entity; "cat" is fine in prose)

**Event**:
A time-bound record tied to exactly one Feline: type `VET`, `GROOMING`, `DAYCARE`, or `WEIGHT`. A Feline's medical history and weight trend are both read as filtered views over its Events — there is no separate "weight log" entity.
_Avoid_: Appointment, log entry, weigh-in (a weigh-in is an Event of type WEIGHT)

**Inventory**:
A consumable supply item (`FOOD`, `LITTER`, `MEDS`) tracked at the Household level, not per-Feline, even for MEDS. Holds a stock level and daily burn rate, from which a depletion date is computed. The reorder alert is that computed depletion date crossing within the item's threshold (default 3 days) — not a separately-tracked stock-quantity rule.
_Avoid_: Stock, supply, reorder threshold as a standalone quantity line (it's a days-of-runway number, computed from depletion date, not a second independent rule)
