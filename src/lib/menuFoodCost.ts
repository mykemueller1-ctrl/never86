/** Ingredient cost only. Public recipe fixtures are fictional. */
export function menuFoodCost(menuPrice: number, otherIngredients: number, cheeseOunces: number, cheesePerUsablePound: number | null, targetPercent: number) {
  if (cheesePerUsablePound === null || ![menuPrice, cheeseOunces, cheesePerUsablePound, targetPercent].every(value => Number.isFinite(value) && value > 0)
    || !Number.isFinite(otherIngredients) || otherIngredients < 0 || targetPercent > 100) return null;
  const cheeseCost = cheeseOunces / 16 * cheesePerUsablePound;
  const plateCost = otherIngredients + cheeseCost;
  const foodCostPercent = plateCost / menuPrice * 100;
  const targetCost = menuPrice * targetPercent / 100;
  if (![cheeseCost, plateCost, foodCostPercent, targetCost].every(Number.isFinite)) return null;
  return { cheeseCost, plateCost, foodCostPercent, targetCost, overTarget: plateCost - targetCost > 1e-9 };
}
