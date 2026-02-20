"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Check } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import type { Extra } from "@/lib/types";

interface Props {
  title: string;
  extras: Extra[];
  selectedExtraId?: string;
  onSelect: (extra: Extra) => void;
  required?: boolean;
}

export function ExtraSelector({
  title,
  extras,
  selectedExtraId,
  onSelect,
  required = false,
}: Props) {
  if (extras.length === 0) {
    return null;
  }

  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
        {title} {required && <span className="text-destructive">*</span>}
      </p>

      <div className="grid grid-cols-2 gap-2">
        {extras.map((extra) => {
          const isSelected = selectedExtraId === extra.id;

          return (
            <Card
              key={extra.id}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                isSelected && "ring-2 ring-primary bg-primary/5",
              )}
              onClick={() => onSelect(extra)}
            >
              <CardContent className="p-3 relative">
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  </div>
                )}

                <p className="font-medium text-sm pr-6">{extra.name}</p>

                {extra.price > 0 ? (
                  <p className="text-xs text-primary mt-0.5">
                    +{formatCurrency(extra.price)}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Incluido
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Mensaje de error si es requerido y no está seleccionado */}
      {required && !selectedExtraId && (
        <p className="text-xs text-destructive mt-2">
          ⚠️ Debes elegir una opción
        </p>
      )}
    </div>
  );
}
