"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon, Plus, X, Search, Loader2, InfoIcon, ChevronDown, Edit, Pencil, AlertTriangle, Store, ShoppingBag, CreditCard } from "lucide-react"
import { cn } from "@/lib/utils"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertToast } from "@/components/ui/alert-toast"
import type { Database, PaymentMethod } from "@/types/supabase"
import { supabase } from "@/lib/supabase"
import { 
  normalizeDate, 
  dateToISOString, 
  isoStringToDate 
} from "@/lib/utils"
import { toast } from "sonner"
import { StoreDialog } from "./StoreDialog"
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { debounce } from "lodash"
import { EditItemDialog } from "./EditItemDialog"
import { AddProductDialog } from "./AddProductDialog"
import { normalizeProductName } from "../utils"
import { useSupabase } from "@/components/providers/supabase-provider"
import { useWorkspace } from "@/components/providers/workspace-provider"
import { PaymentCard } from "@/types/supabase"

type Store = Database["public"]["Tables"]["stores"]["Row"] & {
  category: Database["public"]["Tables"]["store_categories"]["Row"]
}

type Product = Database["public"]["Tables"]["products"]["Row"] & {
  category?: Database["public"]["Tables"]["product_categories"]["Row"]
  brand?: Database["public"]["Tables"]["brands"]["Row"]
  latest_price?: number
  prices_by_store?: Record<number, number>
}

type TicketItem = {
  description: string
  quantity: number
  unitPrice: number
  temporaryItem: boolean
  productId?: number
}

type TicketFormItem = {
  productId: string;
  quantity: number;
  price: number;
  description?: string;
  // Metadata UI
  productName?: string;
  brandName?: string;
  // Información de cambio de precio
  priceChanged?: boolean;
  previousPrice?: number | null;
  isDiscount?: boolean;
  discountEndDate?: string | null;
}

const ticketSchema = z.object({
  storeId: z.string().min(1, "Selecciona una tienda"),
  date: z.date(),
  paymentMethod: z.string().min(1, "Selecciona un método de pago"),
  paymentCardId: z.string().nullable().optional(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().min(0.01),
    price: z.number().min(0),
    description: z.string().optional(),
    productName: z.string().optional(),
    brandName: z.string().optional(),
    // Propiedades para manejo de cambios de precio
    priceChanged: z.boolean().optional(),
    previousPrice: z.number().nullable().optional(),
    isDiscount: z.boolean().optional(),
    discountEndDate: z.string().nullable().optional(),
  })).min(1, "Agrega al menos un item"),
})

type TicketFormSchema = z.infer<typeof ticketSchema>

interface TicketFormProps {
  stores: Store[]
  products: Product[]
  loading: boolean
  selectedDate: string
  formatDateDisplay: (date: string) => string
  onSubmit: (data: {
    storeId: number | undefined
    date: string
    totalAmount: number
    paymentMethod: PaymentMethod
    installments: number
    items: TicketItem[]
    paymentCardId?: number | null
  }) => Promise<void>
  getProducts: (storeId?: number, searchQuery?: string) => Promise<any>
  ticket?: any
  mode?: "create" | "edit"
  onClose: () => void
  isOpen: boolean
  onCreateProduct: (data: { name: string }) => Promise<Product>
  onUpdateProductPrices: (storeId: number, items: { productId: number, price: number, previousPrice: number }[]) => Promise<void>
}

export function TicketForm({
  stores,
  products,
  loading,
  selectedDate,
  formatDateDisplay,
  onSubmit,
  getProducts,
  ticket,
  mode = "create",
  onClose,
  isOpen,
  onCreateProduct,
  onUpdateProductPrices,
}: TicketFormProps) {
  const { supabase, user } = useSupabase()
  const { workspace } = useWorkspace()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState("1")
  const [price, setPrice] = useState("")
  const [description, setDescription] = useState("")
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false)
  const [isQuickCreateMode, setIsQuickCreateMode] = useState(false)
  const [newProductName, setNewProductName] = useState('')
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [selectedProductItem, setSelectedProductItem] = useState<Product | null>(null)
  const [storeDialogOpen, setStoreDialogOpen] = useState(false)
  const [hideHiddenStores, setHideHiddenStores] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [editItemQuantity, setEditItemQuantity] = useState("");
  const [editItemPrice, setEditItemPrice] = useState("");
  const [editItemDescription, setEditItemDescription] = useState("");
  const [isEditItemDialogOpen, setIsEditItemDialogOpen] = useState(false);
  const [similarProductsFound, setSimilarProductsFound] = useState<any[]>([]);
  const [pendingProductName, setPendingProductName] = useState("");
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [showSimilarProductsSection, setShowSimilarProductsSection] = useState(false);
  const [isExactMatch, setIsExactMatch] = useState(false);
  const [paymentCards, setPaymentCards] = useState<PaymentCard[]>([]);
  const [loadingCards, setLoadingCards] = useState(false);

  const form = useForm({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      storeId: ticket?.store_id ? ticket.store_id.toString() : "",
      date: ticket?.date 
        ? normalizeDate(new Date(`${ticket.date}T12:00:00`)) 
        : normalizeDate(new Date(`${selectedDate}T12:00:00`)),
      paymentMethod: ticket?.payment_method || "Efectivo" as PaymentMethod,
      paymentCardId: ticket?.metadata?.payment_card?.id ? ticket.metadata.payment_card.id.toString() : "none",
      items: ticket?.items ? ticket.items.map((item: any) => ({
        productId: item.product_id?.toString(),
        quantity: item.quantity,
        price: item.unit_price,
        description: item.description,
      })) : [],
    },
  })

  const items = form.watch("items") as TicketFormItem[]
  const total = items.reduce((sum: number, item: TicketFormItem) => sum + (item.quantity * item.price), 0)

  // Ordenamos las tiendas: primero las principales, luego las normales, luego las ocultas

  const sortedStores = [...stores].sort((a, b) => {
    // Si ambas tienen la misma prioridad, ordenar por nombre
    return a.name.localeCompare(b.name);
  });


  const handleAddItem = () => {
    if (!selectedProduct && !newProductName) return;
    
    const items = form.getValues("items") || [];
    const productId = selectedProduct ? selectedProduct.id.toString() : "__temp__";
    const productName = selectedProduct ? selectedProduct.name : newProductName;
    
    // Verificar si el producto ya existe en el ticket
    const existingItemIndex = items.findIndex((item: TicketFormItem) => {
      // Para productos guardados, comparar por ID
      if (item.productId === productId && productId !== "__new__" && productId !== "__temp__") {
        return true;
      }
      
      // Para productos nuevos o temporales, comparar por nombre normalizado
      if ((productId === "__new__" || productId === "__temp__") && item.productName) {
        return normalizeProductName(item.productName) === normalizeProductName(productName);
      }
      
      return false;
    });

    // Si el producto ya existe, actualizar la cantidad
    if (existingItemIndex !== -1) {
      const updatedItems = [...items];
      const existingItem = updatedItems[existingItemIndex];
      
      // Sumar la cantidad nueva a la existente
      updatedItems[existingItemIndex] = {
        ...existingItem,
        quantity: existingItem.quantity + Number(quantity)
      };
      
      // Actualizar el estado
      form.setValue("items", updatedItems);
      
      // Limpiar los campos después de agregar
      setSelectedProduct(null);
      setNewProductName("");
      setQuantity("1");
      setPrice("");
      setDescription("");
      setIsProductDialogOpen(false);
      setIsQuickCreateMode(false);
      
      // Notificar al usuario
      toast.success(`Se actualizó la cantidad de "${productName}" en el ticket`);
      return;
    }
    
    let newItem: TicketFormItem = {
      productId: selectedProduct ? selectedProduct.id.toString() : "__temp__",
      quantity: Number(quantity),
      price: Number(price),
      description: description,
    };
    
    if (selectedProduct) {
      newItem.productName = selectedProduct.name;
      newItem.brandName = selectedProduct.brand?.name;
      
      // Verificar si el precio ha cambiado
      const storeId = form.getValues("storeId") ? parseInt(form.getValues("storeId")) : undefined;
      if (storeId && selectedProduct.prices_by_store && selectedProduct.prices_by_store[storeId] !== undefined) {
        const storedPrice = selectedProduct.prices_by_store[storeId];
        const currentPrice = Number(price);
        
        if (storedPrice !== currentPrice) {
          newItem.priceChanged = true;
          newItem.previousPrice = storedPrice;
        }
      }
    } else if (newProductName) {
      newItem.productId = "__new__";
      newItem.productName = newProductName.trim(); // Guardar el nombre sin espacios extras
    }
    
    form.setValue("items", [...items, newItem]);
    
    // Limpiar los campos después de agregar
    setSelectedProduct(null);
    setNewProductName("");
    setQuantity("1");
    setPrice("");
    setDescription("");
    setIsProductDialogOpen(false);
    setIsQuickCreateMode(false);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_: TicketFormItem, i: number) => i !== index)
    form.setValue("items", newItems)
  }

  // Cargar tarjetas de pago
  const loadPaymentCards = async () => {
    if (!user || !workspace) return;
    
    setLoadingCards(true);
    try {
      const { data, error } = await supabase
        .from('payment_cards')
        .select('*')
        .eq('user_id', user.id)
        .eq('workspace_id', workspace.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error al cargar tarjetas:', error);
        return;
      }
      
      setPaymentCards(data || []);
    } catch (error) {
      console.error('Error inesperado al cargar tarjetas:', error);
    } finally {
      setLoadingCards(false);
    }
  };
  
  // Cargar tarjetas cuando cambie el método de pago
  const paymentMethod = form.watch("paymentMethod");
  
  useEffect(() => {
    if (paymentMethod === "Debito" || paymentMethod === "Credito") {
      loadPaymentCards();
    }
  }, [paymentMethod, user, workspace]);

  const onSubmitForm = async (data: TicketFormSchema) => {
    try {
      if (loading) return

      // Comprobar que hay al menos un item
      if (!data.items || data.items.length === 0) {
        toast.error("El ticket debe tener al menos un item")
        return
      }

      let storeId = undefined
      if (data.storeId) {
        // Intentar convertir a número
        try {
          storeId = parseInt(data.storeId)
        } catch(e) {
          console.error("Error convirtiendo storeId:", e)
        }
      }
      
      // Comprobar si el valor de paymentMethod es válido
      if (data.paymentMethod !== "Debito" && data.paymentMethod !== "Credito" && data.paymentMethod !== "Efectivo" && data.paymentMethod !== "Transferencia") {
        // Valor no válido, usar default
        data.paymentMethod = "Debito";
      }
      
      // Si hay productos con cambios de precio, actualizarlos
      const itemsWithPriceChanges = data.items
        .filter((item) => item.priceChanged && item.productId && item.productId !== "__temp__" && item.productId !== "__new__")
        .map((item) => ({
          productId: parseInt(item.productId),
          price: item.price,
          previousPrice: item.previousPrice || 0
        }));
        
      if (itemsWithPriceChanges.length > 0 && storeId) {
        await onUpdateProductPrices(storeId, itemsWithPriceChanges);
      }

      const items = data.items.map((item) => ({
        description: item.description || "",
        quantity: item.quantity,
        unitPrice: item.price,
        temporaryItem: false,
        productId: item.productId ? parseInt(item.productId) : undefined
      }));

      // Conversión de paymentCardId a número si existe y no es "none"
      const paymentCardId = data.paymentCardId && data.paymentCardId !== "none" 
        ? parseInt(data.paymentCardId) 
        : null;
      
      await onSubmit({
        storeId: storeId,
        date: dateToISOString(data.date),
        totalAmount: total,
        paymentMethod: data.paymentMethod as PaymentMethod,
        installments: 1, // Default
        items: items,
        paymentCardId: paymentCardId
      });

      setSelectedProduct(null)
      setDescription("")
      setPrice("")
      setQuantity("1")
      onClose()

      // Limpiar formulario
      form.reset({
        storeId: "",
        date: normalizeDate(new Date()),
        paymentMethod: "Debito" as PaymentMethod,
        paymentCardId: "none",
        items: [],
      });

      toast.success(
        mode === "create"
          ? "Ticket creado correctamente"
          : "Ticket actualizado correctamente"
      )
    } catch (error) {
      console.error("Error al guardar el ticket:", error)
      toast.error("Error al guardar el ticket")
    }
  }

  // Obtener el precio del producto seleccionado para la tienda actual
  useEffect(() => {
    if (selectedProduct && form.getValues('storeId')) {
      const storeId = parseInt(form.getValues('storeId'));
      
      // Lógica para obtener el último precio registrado
      const fetchLatestPrice = async () => {
        try {
          // Consultar la tabla product_price_history para obtener el último precio
          const { data: priceHistory, error } = await supabase
            .from('product_price_history')
            .select('*')
            .eq('product_id', selectedProduct.id)
            .eq('store_id', storeId)
            .order('date', { ascending: false })
            .limit(2); // Obtenemos los dos últimos precios
          
          if (error) throw error;
          
          if (priceHistory && priceHistory.length > 0) {
            const latestPrice = priceHistory[0];
            
            // Verificar si el precio es un descuento con fecha de vencimiento
            if (latestPrice.is_discount && latestPrice.discount_end_date) {
              const endDate = new Date(latestPrice.discount_end_date);
              const now = new Date();
              
              // Si el descuento ha vencido o estamos cerca de la fecha de vencimiento, usar el siguiente precio
              if (endDate < now || (endDate.getTime() - now.getTime()) < 24 * 60 * 60 * 1000) {
                if (priceHistory.length > 1) {
                  // Usar el segundo precio más reciente
                  setPrice(priceHistory[1].price.toString());
                } else {
                  // No hay un segundo precio, usar el último aunque sea un descuento
                  setPrice(latestPrice.price.toString());
                }
              } else {
                // El descuento aún está activo
                setPrice(latestPrice.price.toString());
              }
            } else {
              // No es un descuento o no tiene fecha de vencimiento
              setPrice(latestPrice.price.toString());
            }
          } else if (selectedProduct.prices_by_store && selectedProduct.prices_by_store[storeId]) {
            // Fallback a precios por tienda si no hay historial
            setPrice(selectedProduct.prices_by_store[storeId].toString());
          } else if (selectedProduct.latest_price) {
            // Fallback al último precio conocido
            setPrice(selectedProduct.latest_price.toString());
          } else {
            // Sin precio previo
            setPrice("");
          }
        } catch (error) {
          console.error('Error al obtener el precio más reciente:', error);
          
          // Fallbacks en caso de error
          if (selectedProduct.prices_by_store && selectedProduct.prices_by_store[storeId]) {
            setPrice(selectedProduct.prices_by_store[storeId].toString());
          } else if (selectedProduct.latest_price) {
            setPrice(selectedProduct.latest_price.toString());
          } else {
            setPrice("");
          }
        }
      };
      
      fetchLatestPrice();
    }
  }, [selectedProduct, form]);

  // Función de manejo de envío para debugging
  const handleSubmitDebug = (e: React.FormEvent) => {
    e.preventDefault(); // Prevenir comportamiento por defecto
    
    // Verificar si hay errores antes de proceder
    const formState = form.formState;
    console.log("formState: ", formState)
    if (formState.isSubmitting) {
      console.log("El formulario ya está siendo enviado, ignorando esta solicitud");
      return;
    }
    
    // Verificar que los datos básicos estén presentes
    const currentValues = form.getValues();
    if (!currentValues.storeId) {
      AlertToast.error("Por favor selecciona una tienda");
      return;
    }
    
    if (!currentValues.items || currentValues.items.length === 0) {
      AlertToast.error("Por favor agrega al menos un producto");
      return;
    }
    
    console.log("Form values ANTES:", currentValues);
    
    // Corregir items con priceChanged nulo
    if (currentValues.items) {
      const correctedItems = currentValues.items.map((item: TicketFormItem) => {
        // Verificar si realmente es null
        if (item.priceChanged === null) {
          console.log("🔴 Encontrado priceChanged null, corrigiendo a false");
          return {
            ...item,
            priceChanged: false
          };
        }
        return item;
      });
      
      // Forzar actualización inmediata antes de continuar
      form.setValue('items', correctedItems, { 
        shouldValidate: true,  // Forzar validación inmediata
        shouldDirty: true,     // Marcar como modificado
        shouldTouch: true      // Marcar como tocado
      });
    }
    
    // Verificar si la corrección funcionó
    const afterUpdate = form.getValues();
    console.log("Form values DESPUÉS:", afterUpdate);
    const stillHasNullPriceChanged = afterUpdate.items?.some(
      (item: any) => item.priceChanged === null
    );
    
    if (stillHasNullPriceChanged) {
      console.error("⚠️ La corrección no funcionó, todavía hay valores null");
    }
    
    // Delay para asegurar que la actualización del estado se ha completado
    setTimeout(() => {
      // Verificar errores después de un tiempo para permitir la actualización
      if (Object.keys(form.formState.errors).length > 0) {
        console.error("Errores de validación después de corrección:", form.formState.errors);
        
        // Intentar dar un mensaje más específico basado en el tipo de error
        let errorMessage = "Por favor corrige los errores del formulario";
        const errors = form.formState.errors;
            
        if (errors.storeId) {
          errorMessage = "Por favor selecciona una tienda";
        } else if (errors.items) {
          if (errors.items.message && typeof errors.items.message === 'string') {
            errorMessage = errors.items.message;
          } else {
            errorMessage = "Debes agregar al menos un producto";
          }
        } else if (errors.paymentMethod) {
          errorMessage = "Selecciona un método de pago válido";
        }
        
        AlertToast.error(errorMessage);
        return;
      }
      
      // Usar form.handleSubmit para manejar validaciones con nuestros datos corregidos
      try {
        const onValid = (data: TicketFormSchema) => {
          console.log("✅ Form submitted with data:", data);
          return onSubmitForm(data);
        };
        
        const onInvalid = (errors: any) => {
          // Si hay errores, mostrar mensaje específico basado en los errores
          if (errors && Object.keys(errors).length > 0) {
            console.error("❌ Errores de validación en el formulario:", errors);
            
            // Intentar dar un mensaje más específico basado en el tipo de error
            let errorMessage = "Por favor corrige los errores del formulario";
            
            if (errors.storeId) {
              errorMessage = "Por favor selecciona una tienda";
            } else if (errors.items) {
              if (errors.items.message && typeof errors.items.message === 'string') {
                errorMessage = errors.items.message;
              } else {
                errorMessage = "Debes agregar al menos un producto";
              }
            } else if (errors.paymentMethod) {
              errorMessage = "Selecciona un método de pago válido";
            }
            
            AlertToast.error(errorMessage);
          } else {
            // Si no hay errores específicos, podría ser un problema con la validación del zod
            console.warn("⚠️ Se llamó onInvalid pero no hay errores específicos");
            
            // Verificar si hay productos en el formulario
            const items = form.getValues("items");
            if (!items || items.length === 0) {
              AlertToast.error("Debes agregar al menos un producto");
              return;
            }
            
            // Verificar otros campos requeridos
            const storeId = form.getValues("storeId");
            if (!storeId) {
              AlertToast.error("Por favor selecciona una tienda");
              return;
            }
            
            // Si llegamos aquí, es un error desconocido
            AlertToast.error("Error en el formulario. Verifica todos los campos.");
          }
        };
        
        // Crear un nuevo evento sintético para pasar a handleSubmit
        const syntheticEvent = {
          ...e,
          preventDefault: () => {}
        };
        
        // Ejecutar validación y envío con los datos ya corregidos
        form.handleSubmit(onValid, onInvalid)(syntheticEvent);
      } catch (error) {
        console.error("Error al intentar enviar el formulario:", error);
        AlertToast.error("Error inesperado al enviar el formulario");
      }
    }, 100); // Pequeño delay para asegurar que React actualiza el estado
  };

  // Manejar la creación de tienda exitosa
  const handleStoreCreated = (storeId: number) => {
    console.log("Tienda creada con ID:", storeId);
    form.setValue('storeId', storeId.toString());
    setStoreDialogOpen(false);
  }

  const handleToggleHideHiddenStores = () => {
    setHideHiddenStores(!hideHiddenStores);
  }

  // Función con debounce para buscar productos
  const debouncedSearch = debounce(async (query: string) => {
    if (!query || query.length < 2) {
      setFilteredProducts([]);
      setIsSearching(false);
      return;
    }

    try {
      const storeId = form.getValues('storeId') ? parseInt(form.getValues('storeId')) : undefined;
      const results = await getProducts(storeId, query);
      setFilteredProducts(results);
      setIsSearching(false);
    } catch (error) {
      console.error("Error buscando productos:", error);
      setIsSearching(false);
    }
  }, 300);

  // Añadir función para manejar la edición de un item
  const handleEditItem = (index: number) => {
    const item = items[index];
    setEditingItemIndex(index);
    setEditItemQuantity(item.quantity.toString());
    setEditItemPrice(item.price.toString());
    setEditItemDescription(item.description || "");
    setIsEditItemDialogOpen(true);
  };

  // Función para guardar los cambios de un item editado
  const handleSaveEditedItem = (
    index: number, 
    quantity: number, 
    price: number, 
    description: string
  ) => {
    const updatedItems = [...items];
    const item = updatedItems[index];
    
    // Actualizar los valores del item
    updatedItems[index] = {
      ...item,
      quantity,
      price,
      description
    };
    
    // Actualizar el estado
    form.setValue("items", updatedItems);
    
    // Cerrar el diálogo y resetear los valores
    setIsEditItemDialogOpen(false);
    setEditingItemIndex(null);
  };

  // Función para verificar productos similares antes de crear
  const checkSimilarProductsBeforeCreate = async (productName: string) => {
    try {
      setIsCreatingProduct(true);
      // Buscar productos con nombres similares
      const storeId = form.getValues('storeId') ? parseInt(form.getValues('storeId')) : undefined;
      const searchResults = await getProducts(storeId, productName);
      
      // Normalizar el nombre para comparación
      const normalizedInputName = normalizeProductName(productName);
      
      // Si hay resultados, filtrar los exactamente iguales usando la normalización
      const exactMatch = searchResults.find(
        (p: any) => normalizeProductName(p.name) === normalizedInputName
      );
      
      if (exactMatch) {
        // En lugar de mostrar un banner informativo, ahora se maneja este caso en el componente AddProductDialog
        return false;
      }
      
      // Si hay productos similares pero no exactos, mostrar la sección de productos similares dentro del mismo diálogo
      if (searchResults.length > 0) {
        setSimilarProductsFound(searchResults);
        setPendingProductName(productName);
        setShowSimilarProductsSection(true);
        setIsExactMatch(false);
        setIsCreatingProduct(false);
        return false; // No crear aún, esperamos decisión del usuario
      }
      
      // Si no hay similares, proceder con la creación
      return true;
    } catch (error) {
      console.error("Error al verificar productos similares:", error);
      toast.error("Error al verificar productos similares. Inténtalo de nuevo.");
      setIsCreatingProduct(false);
      return true; // Si falla la verificación, permitir crear para no bloquear al usuario
    }
  };

  // Función para proceder con la creación después de la confirmación
  const proceedWithProductCreation = async () => {
    try {
    const isProductNameUnique = await checkSimilarProductsBeforeCreate(pendingProductName);

      setIsCreatingProduct(true);
      if(isProductNameUnique){
      const storeId = form.getValues('storeId');
      const newProduct = await onCreateProduct({
          name: pendingProductName.trim(), // Asegurar que se guarda sin espacios extras
      });
      
      if (!newProduct) {
        toast.error("No se pudo crear el producto. Verifica que todos los campos estén completos.");
        setIsCreatingProduct(false);
        return;
      }
      
      setSelectedProduct(newProduct);
      handleAddItem();
      setShowSimilarProductsSection(false);
      setPendingProductName("");
      setSimilarProductsFound([]);
    
      } else {
       setShowSimilarProductsSection(!isProductNameUnique);
       setIsCreatingProduct(false);
       }
    } catch (error: any) {
      console.error("Error al crear el producto:", error);
      if (error.message) {
        toast.error(error.message);
      } else {
        toast.error("Error al crear el producto. Inténtalo de nuevo.");
      }
      setIsCreatingProduct(false);
    }
    finally{
      setIsCreatingProduct(false);
    }
  };

  // Función para seleccionar un producto existente desde el diálogo
  const selectExistingProduct = (product: any) => {
    setSelectedProduct(product);
    setSelectedProductItem(product);
    
    // Si el producto tiene precio para esta tienda, usarlo
    const storeId = form.getValues('storeId') ? parseInt(form.getValues('storeId')) : undefined;
    if (storeId && product.prices_by_store && typeof product.prices_by_store === 'object' && 
        storeId in product.prices_by_store && product.prices_by_store[storeId]) {
      setPrice(product.prices_by_store[storeId].toString());
    } else if (product.latest_price) {
      // Si no tiene precio para esta tienda pero sí tiene un precio más reciente general
      setPrice(product.latest_price.toString());
    }
    
    setShowSimilarProductsSection(false);
    setPendingProductName("");
    setSimilarProductsFound([]);
  };

  // Función para manejar agregar un producto desde el diálogo
  const handleAddProductFromDialog = (data: {
    product: Product | null;
    productId: string;
    quantity: number;
    price: number;
    description: string;
    isNewProduct: boolean;
    productName: string;
  }) => {
    const items = form.getValues("items") || [];
    const productId = data.product ? data.product.id.toString() : data.isNewProduct ? "__new__" : "__temp__";
    
    // Verificar si el producto ya existe en el ticket
    const existingItemIndex = items.findIndex((item: TicketFormItem) => {
      // Para productos guardados, comparar por ID
      if (item.productId === productId && productId !== "__new__" && productId !== "__temp__") {
        return true;
      }
      
      // Para productos nuevos o temporales, comparar por nombre normalizado
      if ((productId === "__new__" || productId === "__temp__") && item.productName) {
        return normalizeProductName(item.productName) === normalizeProductName(data.productName);
      }
      
      return false;
    });

    // Si el producto ya existe, actualizar la cantidad
    if (existingItemIndex !== -1) {
      const updatedItems = [...items];
      const existingItem = updatedItems[existingItemIndex];
      
      // Sumar la cantidad nueva a la existente
      updatedItems[existingItemIndex] = {
        ...existingItem,
        quantity: existingItem.quantity + data.quantity
      };
      
      // Actualizar el estado
      form.setValue("items", updatedItems);
      
      // Notificar al usuario
      toast.success(`Se actualizó la cantidad de "${data.productName}" en el ticket`);
      return;
    }
    
    // Si el producto no existe, crear un nuevo item
    let newItem: TicketFormItem = {
      productId,
      quantity: data.quantity,
      price: data.price,
      description: data.description,
      productName: data.product ? data.product.name : data.productName,
      brandName: data.product?.brand?.name,
    };
    
    // Verificar si el precio ha cambiado
    if (data.product) {
      const storeId = form.getValues("storeId") ? parseInt(form.getValues("storeId")) : undefined;
      if (storeId && data.product.prices_by_store && data.product.prices_by_store[storeId] !== undefined) {
        const storedPrice = data.product.prices_by_store[storeId];
        const currentPrice = data.price;
        
        if (storedPrice !== currentPrice) {
          newItem.priceChanged = true;
          newItem.previousPrice = storedPrice;
        }
      }
    }
    
    form.setValue("items", [...items, newItem]);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !loading && !form.formState.isSubmitting && !open && onClose()}>
        <DialogContent className="sm:max-w-[700px] max-h-[95vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>
              {mode === "create" ? "Crear nuevo ticket" : "Editar ticket"}
            </DialogTitle>
            <DialogDescription>
              {mode === "create" 
                ? `Registra un nuevo ticket para ${formatDateDisplay(selectedDate)}`
                : `Editar ticket del ${formatDateDisplay(ticket?.date || selectedDate)}`
              }
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={handleSubmitDebug} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="storeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tienda</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}>
                            <SelectValue placeholder="Selecciona una tienda" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {sortedStores.map((store) => (
                            (!hideHiddenStores || !store.is_hidden) && (
                            <SelectItem 
                              key={store.id} 
                              value={store.id.toString()}
                            >
                              {store.name}
                            </SelectItem>
                            )
                          ))}
                          <Button
                            type="button"
                            variant="ghost"
                            className="w-full justify-start text-left mt-2 border-t pt-2"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setStoreDialogOpen(true);
                            }}
                          >
                            + Crear nueva tienda
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            className="w-full justify-start text-left mt-2 border-t pt-2"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleToggleHideHiddenStores();
                            }}
                          >
                            {hideHiddenStores ? "Mostrar tiendas ocultas" : "Ocultar tiendas ocultas"}
                          </Button>

                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP", { locale: es })
                              ) : (
                                <span>Selecciona una fecha</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Método de pago</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el método de pago" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Efectivo">Efectivo</SelectItem>
                        <SelectItem value="Debito">Débito</SelectItem>
                        <SelectItem value="Credito">Crédito</SelectItem>
                        <SelectItem value="Transferencia">Transferencia</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Selector de tarjeta si el método de pago es débito o crédito */}
              {(form.watch("paymentMethod") === "Debito" || form.watch("paymentMethod") === "Credito") && (
                <FormField
                  control={form.control}
                  name="paymentCardId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tarjeta de pago</FormLabel>
                      <Select
                        value={field.value || ""}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona una tarjeta" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Sin tarjeta</SelectItem>
                          {paymentCards.map((card) => (
                            <SelectItem key={card.id} value={card.id.toString()}>
                              {card.card_name} - {card.bank} {card.is_default && "(Predeterminada)"}
                            </SelectItem>
                          ))}
                          <Button
                            type="button"
                            variant="ghost"
                            className="w-full justify-start text-left mt-2 border-t pt-2"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              window.open("/dashboard/profile/paymentCards", "_blank");
                            }}
                          >
                            <CreditCard className="mr-2 h-4 w-4" />
                            Administrar tarjetas
                          </Button>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Selecciona la tarjeta utilizada para este pago
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <FormLabel>Items</FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsProductDialogOpen(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar item
                  </Button>
                </div>

                <ScrollArea className="h-[200px] rounded-md border">
                  {items.length > 0 ? (
                    <div className="p-4 space-y-4">
                      {items.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-muted/50 p-3 rounded-lg"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {item.productName}
                              </span>
                              {item.brandName && (
                                <Badge variant="secondary" className="text-xs">
                                  {item.brandName}
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {item.quantity} x ${item.price.toFixed(2)} = ${(item.quantity * item.price).toFixed(2)}
                            </div>
                            {item.description && (
                              <div className="text-sm text-muted-foreground">
                                {item.description}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditItem(index)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              onClick={() => handleRemoveItem(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      No hay items agregados
                    </div>
                  )}
                </ScrollArea>

                <div className="flex justify-end text-lg font-semibold">
                  Total: ${total.toFixed(2)}
                </div>
              </div>

              <DialogFooter>
                <Button type="submit" disabled={loading || form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : mode === "create" ? "Crear ticket" : "Actualizar ticket"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Usar el componente AddProductDialog */}
      <AddProductDialog
        open={isProductDialogOpen}
        onOpenChange={setIsProductDialogOpen}
        storeId={form.getValues("storeId")}
        products={products}
        getProducts={getProducts}
        onCreateProduct={onCreateProduct}
        onAddItem={handleAddProductFromDialog}
      />

      {/* Usar el componente EditItemDialog */}
      <EditItemDialog
        open={isEditItemDialogOpen}
        onOpenChange={setIsEditItemDialogOpen}
        item={editingItemIndex !== null ? items[editingItemIndex] : null}
        index={editingItemIndex}
        onSave={handleSaveEditedItem}
      />

      {/* Diálogo para crear tienda */}
      {storeDialogOpen && (
        <StoreDialog
          open={storeDialogOpen}
          onOpenChange={setStoreDialogOpen}
          onStoreCreated={handleStoreCreated}
        />
      )}
    </>
  )
} 