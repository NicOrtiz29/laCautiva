"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  category: z.string().min(1, {
    message: "Por favor, selecciona una categoría.",
  }),
  description: z.string().min(2, {
    message: "La descripción debe tener al menos 2 caracteres.",
  }).max(50, {
    message: "La descripción debe tener 50 caracteres o menos."
  }),
  amount: z.coerce.number().positive({
    message: "Por favor, introduce una cantidad positiva.",
  }),
});

interface TransactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'deposit' | 'expense';
  onSubmit: (data: z.infer<typeof formSchema>) => void;
}

export default function TransactionForm({ open, onOpenChange, type, onSubmit }: TransactionFormProps) {
  const { toast } = useToast();
  
  // Categorías predefinidas según el tipo de transacción
  const categories = type === 'deposit' 
    ? [
        { value: 'cuota', label: 'Cuota Mensual' },
        { value: 'donacion', label: 'Donación' },
        { value: 'subvencion', label: 'Subvención' },
        { value: 'evento', label: 'Evento' },
        { value: 'viajes', label: 'Viajes' },
        { value: 'otros_ingresos', label: 'Otros Ingresos' }
      ]
    : [
        { value: 'viajes', label: 'Viajes' },
        { value: 'mantenimiento', label: 'Mantenimiento' },
        { value: 'limpieza', label: 'Limpieza' },
        { value: 'construccion', label: 'Construcción' },
        { value: 'otros', label: 'Otros' }
      ];
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: "",
      description: "",
      amount: 0,
    },
  });

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    // Combinar categoría y descripción
    const fullDescription = `${values.category} - ${values.description}`;
    onSubmit({ ...values, description: fullDescription });
    form.reset();
    onOpenChange(false);
    toast({
      title: `${type === 'deposit' ? 'Depósito' : 'Gasto'} Añadido`,
      description: `Se ha añadido correctamente "${fullDescription}" por $${values.amount}.`,
    });
  };

  const title = type === 'deposit' ? 'Añadir un Nuevo Depósito' : 'Añadir un Nuevo Gasto';
  const description = type === 'deposit' ? 'Introduce los detalles del nuevo ingreso.' : 'Introduce los detalles del nuevo gasto.';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoría</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una categoría" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Input placeholder="p. ej., Compras semanales" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cantidad ($)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0.00" {...field} step="0.01" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="submit">Añadir {type === 'deposit' ? 'Depósito' : 'Gasto'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
