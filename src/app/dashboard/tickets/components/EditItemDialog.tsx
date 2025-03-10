import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TicketFormItem } from "./types";

interface EditItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: TicketFormItem | null;
  index: number | null;
  onSave: (index: number, quantity: number, price: number, description: string) => void;
}

export function EditItemDialog({
  open, 
  onOpenChange,
  item,
  index,
  onSave
}: EditItemDialogProps) {
  const [quantity, setQuantity] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [description, setDescription] = React.useState("");

  // Actualizar los estados cuando cambia el item
  React.useEffect(() => {
    if (item) {
      setQuantity(item.quantity.toString());
      setPrice(item.price.toString());
      setDescription(item.description || "");
    }
  }, [item]);

  const handleSave = () => {
    if (index === null) return;
    onSave(index, Number(quantity), Number(price), description);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar item</DialogTitle>
          <DialogDescription>
            Modifica la cantidad, precio o descripción del producto
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="font-medium">
              {item.productName}
            </span>
            {item.brandName && (
              <Badge variant="secondary" className="text-xs">
                {item.brandName}
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Cantidad</label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Precio unitario</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Descripción (opcional)</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Oferta 2x1, Con descuento, etc."
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!quantity || !price || Number(quantity) <= 0 || Number(price) < 0}
          >
            Guardar cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 