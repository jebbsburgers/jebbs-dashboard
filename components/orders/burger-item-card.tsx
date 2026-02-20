"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Minus, Plus, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/format";

/* ================= TYPES ================= */

export type SelectedBurger = {
  id: string;
  quantity: number;
  meatCount: number;
  friesQuantity: number; // 🍟
  removedIngredients: string[];
  selectedExtras: {
    extra: { id: string; name: string; price: number };
    quantity: number;
  }[];
  burger: {
    id: string;
    name: string;
    base_price: number;
    default_meat_quantity: number; // ✅
    default_fries_quantity: number; // ✅
    ingredients: string[];
  };
};

type Props = {
  item: SelectedBurger;
  expanded: boolean;

  meatExtra?: { price: number } | null;
  friesExtra?: { price: number } | null; // 🆕
  extrasByCategory: Record<string, any[]>;

  /* Base counts para calcular ajustes en combos */
  baseMeatCount?: number;
  baseFriesCount?: number; // 🆕

  /* Handlers */
  onToggleExpand: () => void;
  onUpdateQuantity: (delta: number) => void;
  onRemove: () => void;
  onToggleIngredient: (ingredient: string) => void;
  onUpdateMeatCount: (delta: number) => void;
  onUpdateFriesCount: (delta: number) => void; // 🆕
  onToggleExtra: (extra: any) => void;
  onUpdateExtraQuantity: (extraId: string, delta: number) => void;
};

/* ================= COMPONENT ================= */

export function SelectedBurgerCard({
  item,
  expanded,
  meatExtra,
  friesExtra,
  extrasByCategory,
  baseMeatCount,
  baseFriesCount, // 🆕

  onToggleExpand,
  onUpdateQuantity,
  onRemove,
  onToggleIngredient,
  onUpdateMeatCount,
  onUpdateFriesCount, // 🆕
  onToggleExtra,
  onUpdateExtraQuantity,
}: Props) {
  // Referencias base para calcular ajustes
  const referenceMeatCount =
    baseMeatCount ?? item.burger.default_meat_quantity ?? 2; // ✅
  const referenceFriesCount =
    baseFriesCount ?? item.burger.default_fries_quantity ?? 1; // ✅

  // 🔧 Label de medallones
  const getMeatLabel = () => {
    const count = item.meatCount;
    const diff = count - referenceMeatCount;

    if (diff === 0) {
      if (count === 1) return "Simple";
      if (count === 2) return "Doble";
      if (count === 3) return "Triple";
      return `${count} carnes`;
    }

    if (diff < 0) {
      return `${count} ${count === 1 ? "carne" : "carnes"} (-${formatCurrency(
        Math.abs(diff) * (meatExtra?.price ?? 0),
      )})`;
    }

    return `+${formatCurrency(diff * (meatExtra?.price ?? 0))}`;
  };

  // 🍟 Label de papas
  const getFriesLabel = () => {
    const count = item.friesQuantity;
    const diff = count - referenceFriesCount;

    if (diff === 0) {
      if (count === 0) return "Sin papas";
      if (count === 1) return "1 porción (incluida)";
      return `${count} porciones`;
    }

    if (diff < 0) {
      return `Sin papas (-${formatCurrency(
        Math.abs(diff) * (friesExtra?.price ?? 0),
      )})`;
    }

    return `${count} ${count === 1 ? "porción" : "porciones"} (+${formatCurrency(
      diff * (friesExtra?.price ?? 0),
    )})`;
  };

  return (
    <Card>
      <CardContent className="p-3">
        {/* HEADER */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="font-medium">{item.burger.name}</p>
            <p className="text-sm text-muted-foreground">
              {formatCurrency(item.burger.base_price)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 bg-transparent"
              onClick={() => onUpdateQuantity(-1)}
            >
              <Minus className="h-3 w-3" />
            </Button>

            <span className="w-6 text-center text-sm font-medium">
              {item.quantity}
            </span>

            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 bg-transparent"
              onClick={() => onUpdateQuantity(1)}
            >
              <Plus className="h-3 w-3" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive"
              onClick={onRemove}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* TOGGLE */}
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 h-auto p-2 text-xs text-primary"
          onClick={onToggleExpand}
        >
          {expanded ? "Ocultar personalización" : "Personalizar"}
        </Button>

        {/* EXPANDED */}
        {expanded && (
          <div className="mt-3 space-y-6 border-t pt-3">
            {/* INGREDIENTS */}
            {item.burger.ingredients.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                  Ingredientes (click para quitar)
                </p>
                <div className="flex flex-wrap gap-2">
                  {item.burger.ingredients.map((ingredient) => {
                    const isRemoved =
                      item.removedIngredients.includes(ingredient);

                    return (
                      <Badge
                        key={ingredient}
                        variant={isRemoved ? "secondary" : "outline"}
                        className={cn(
                          "cursor-pointer transition-colors",
                          isRemoved && "line-through opacity-60",
                        )}
                        onClick={() => onToggleIngredient(ingredient)}
                      >
                        {isRemoved && <X className="mr-1 h-3 w-3" />}
                        {ingredient}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex w-full justify-start gap-6">
              {/* MEAT */}
              {meatExtra && (
                <div>
                  <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                    Medallones
                  </p>

                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      disabled={item.meatCount <= 1}
                      onClick={() => onUpdateMeatCount(-1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>

                    <span className="text-sm font-medium">
                      {item.meatCount}
                    </span>

                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onUpdateMeatCount(1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>

                    <span className="text-xs text-muted-foreground">
                      {getMeatLabel()}
                    </span>
                  </div>
                </div>
              )}

              {/* FRIES 🍟 */}
              {friesExtra && (
                <div>
                  <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                    Papas Fritas
                  </p>

                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      disabled={item.friesQuantity <= 0}
                      onClick={() => onUpdateFriesCount(-1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>

                    <span className="text-sm font-medium">
                      {item.friesQuantity}
                    </span>

                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onUpdateFriesCount(1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>

                    <span className="text-xs text-muted-foreground">
                      {getFriesLabel()}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* EXTRAS - Filtrar medallones Y papas */}
            {Object.entries(extrasByCategory).map(
              ([category, categoryExtras]) => (
                <div key={category}>
                  <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                    {category === "extra"
                      ? "Extras"
                      : category === "drink"
                        ? "Bebidas"
                        : category === "fries"
                          ? "Papas"
                          : category === "sides"
                            ? "Acompañamientos"
                            : "Otros"}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {categoryExtras
                      .filter(
                        (e) =>
                          e.name !== "Medallón extra" &&
                          e.name !== "Papas Fritas Chicas",
                      )
                      .map((extra) => {
                        const selected = item.selectedExtras.find(
                          (e) => e.extra.id === extra.id,
                        );

                        return (
                          <Badge
                            key={extra.id}
                            variant={selected ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => onToggleExtra(extra)}
                          >
                            {extra.name} +{formatCurrency(extra.price)}
                            {selected &&
                              selected.quantity > 1 &&
                              ` x${selected.quantity}`}
                          </Badge>
                        );
                      })}
                  </div>
                </div>
              ),
            )}
            {/* SELECTED EXTRAS */}
            {item.selectedExtras.length > 0 && (
              <div className="mt-2 space-y-1">
                {item.selectedExtras.map((ext) => (
                  <div
                    key={ext.extra.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span>{ext.extra.name}</span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => onUpdateExtraQuantity(ext.extra.id, -1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>

                      <span className="w-6 text-center text-xs">
                        {ext.quantity}
                      </span>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => onUpdateExtraQuantity(ext.extra.id, 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
