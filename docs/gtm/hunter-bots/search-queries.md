# Hunter Queries — loaded and waiting

Use on Grok (X native search + web for Reddit/Facebook). Rotate daily — don't spam the same query.

## X — 3P / payout

```
"DoorDash" (fees OR commission OR "take rate") (restaurant OR owner) -driver -dasher -"delivery driver"
"Uber Eats" payout restaurant owner -driver
"Grubhub" restaurant fees indie -corporate
marketplace statement restaurant doesn't match deposit
"restaurant funded" promotion DoorDash OR Uber
```

## X — margins / labor / ops stack

```
restaurant "prime cost" OR "food cost" (owner OR "my restaurant") -recipe -blog
"MarginEdge" OR "Restaurant365" OR R365 restaurant (frustrated OR help OR broken)
"7shifts" labor restaurant owner
Toast OR Square labor % restaurant owner
invoice vendor restaurant "doesn't match" OR drift
```

## X — Iowa / Midwest lane

```
Iowa restaurant owner (DoorDash OR labor OR margin)
Midwest independent restaurant (fees OR "third party")
Des Moines OR "Fort Dodge" OR "Cedar Rapids" restaurant owner
```

## Reddit (add r/barowners, r/FoodTrucks — see reddit-hunt.md)

```
site:reddit.com/r/restaurantowners DoorDash OR "Uber Eats" OR Grubhub
site:reddit.com/r/restaurantowners MarginEdge OR R365 OR "7shifts"
site:reddit.com/r/restaurateur delivery fees
site:reddit.com/r/barowners doordash OR "prime cost"
site:reddit.com/r/FoodTrucks grubhub OR doordash commission
site:reddit.com/r/smallbusiness restaurant "third party" delivery
```

## TikTok (search + comment hunt — see tiktok-hunt.md)

```
DoorDash fees restaurant owner
restaurant profit margins 2026
third party delivery killing restaurant
Uber Eats payout wrong restaurant
Grubhub commission food truck
MarginEdge restaurant frustrated
```

Browse: `#restaurantowner` `#restaurantlife` `#restauranttok` `#smallbusinessowner` `#doordash` `#ubereats` `#iowa` `#desmoines`

## Facebook (web search — see facebook-groups.md)

```
"restaurant owners" facebook group DoorDash fees
independent restaurant owners facebook "third party delivery"
restaurant operators facebook group labor cost
```

## Negative filters (always apply)

```
-driver -dasher -"delivery driver" -customer -yelp -reviewer -"food blogger"
-"40 locations" -"50 units" -franchise -corporate -"VP operations"
```

## Vertical tags (for scoring notes)

| Tag | Examples |
|---|---|
| pizza | pizza owner, pizzeria, slice |
| bar | bar owner, taproom, liquor |
| qsr | taco, burger, chicken, fast casual |
| full-service | bistro, diner, steakhouse indie |
| ops-stack | MarginEdge, R365, 7shifts, Toast, Square, Clover |
