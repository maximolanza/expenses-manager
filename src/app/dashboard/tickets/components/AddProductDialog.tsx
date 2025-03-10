import React from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Plus, X, Search, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Product } from "../types";
import { debounce } from "lodash";
import { normalizeProductName } from "../utils";

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId?: string;
  products: Product[];
  getProducts: (storeId?: number, searchQuery?: string) => Promise<any>;
  onCreateProduct: (data: { name: string }) => Promise<Product>;
  onAddItem: (data: {
    product: Product | null;
    productId: string;
    quantity: number;
    price: number;
    description: string;
    isNewProduct: boolean;
    productName: string;
  }) => void;
}

export function AddProductDialog({
  open,
  onOpenChange,
  storeId,
  products,
  getProducts,
  onCreateProduct,
  onAddItem,
}: AddProductDialogProps) {
  // Estados para gestionar la búsqueda de productos
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isSearching, setIsSearching] = React.useState(false);
  const [filteredProducts, setFilteredProducts] = React.useState<Product[]>([]);
  
  // Estados para el producto seleccionado o nuevo
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
  const [isQuickCreateMode, setIsQuickCreateMode] = React.useState(false);
  const [newProductName, setNewProductName] = React.useState("");
  const [isCreatingProduct, setIsCreatingProduct] = React.useState(false);
  
  // Estados para los productos similares
  const [showSimilarProductsSection, setShowSimilarProductsSection] = React.useState(false);
  const [similarProductsFound, setSimilarProductsFound] = React.useState<Product[]>([]);
  const [pendingProductName, setPendingProductName] = React.useState("");
  const [isExactMatch, setIsExactMatch] = React.useState(false);
  
  // Estado para el mensaje de error de producto existente
  const [productNameError, setProductNameError] = React.useState<string | null>(null);
  
  // Estados para los detalles del producto
  const [quantity, setQuantity] = React.useState("1");
  const [price, setPrice] = React.useState("");
  const [description, setDescription] = React.useState("");

  // Función para buscar productos
  const searchProducts = React.useCallback(
    debounce(async (query: string) => {
      if (query.length < 2) {
        setFilteredProducts([]);
        setIsSearching(false);
        return;
      }

      try {
        setIsSearching(true);
        const storeIdNumber = storeId ? parseInt(storeId) : undefined;
        const results = await getProducts(storeIdNumber, query);
        setFilteredProducts(results);
      } catch (error) {
        console.error("Error searching products:", error);
        toast.error("Error al buscar productos");
      } finally {
        setIsSearching(false);
      }
    }, 300),
    [getProducts, storeId]
  );

  // Actualizar búsqueda cuando cambia el término
  React.useEffect(() => {
    searchProducts(searchTerm);
  }, [searchTerm, searchProducts]);

  // Limpiar los estados al cerrar el diálogo
  React.useEffect(() => {
    if (!open) {
      setSearchTerm("");
      setFilteredProducts([]);
      setSelectedProduct(null);
      setQuantity("1");
      setPrice("");
      setDescription("");
      setIsQuickCreateMode(false);
      setNewProductName("");
      setShowSimilarProductsSection(false);
      setSimilarProductsFound([]);
      setPendingProductName("");
    }
  }, [open]);

  // Verificar productos similares antes de crear
  const checkSimilarProductsBeforeCreate = async (productName: string) => {
    try {
      setIsCreatingProduct(true);
      setProductNameError(null); // Limpiar errores previos
      
      const storeIdNumber = storeId ? parseInt(storeId) : undefined;
      const searchResults = await getProducts(storeIdNumber, productName);
      
      // Normalizar el nombre para comparación
      const normalizedInputName = normalizeProductName(productName);
      
      // Si hay resultados, filtrar los exactamente iguales usando la normalización
      const exactMatch = searchResults.find(
        (p: any) => normalizeProductName(p.name) === normalizedInputName
      );
      
      if (exactMatch) {
        // En lugar de mostrar el diálogo, establecer el mensaje de error
        setProductNameError(`Ya existe un producto con el nombre "${productName}"`);
        setIsCreatingProduct(false);
        return false;
      }
      
      if (searchResults.length > 0) {
        setSimilarProductsFound(searchResults);
        setPendingProductName(productName);
        setShowSimilarProductsSection(true);
        setIsExactMatch(false);
        setIsCreatingProduct(false);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Error al verificar productos similares:", error);
      toast.error("Error al verificar productos similares. Inténtalo de nuevo.");
      setIsCreatingProduct(false);
      return true;
    }
  };

  // Limpiar el error cuando cambia el nombre del producto
  React.useEffect(() => {
    setProductNameError(null);
  }, [newProductName]);

  // Función para crear un nuevo producto
  const handleCreateProduct = async () => {
    try {
      const productNameToUse = isQuickCreateMode ? newProductName : pendingProductName;
      
      // Primero verificar si ya existe un producto con este nombre exacto
      setIsCreatingProduct(true);
      setProductNameError(null);
      
      const storeIdNumber = storeId ? parseInt(storeId) : undefined;
      const searchResults = await getProducts(storeIdNumber, productNameToUse);
      
      // Normalizar el nombre para comparación
      const normalizedInputName = normalizeProductName(productNameToUse);
      
      // Buscar coincidencia exacta con normalización
      const exactMatch = searchResults.find(
        (p: any) => normalizeProductName(p.name) === normalizedInputName
      );
      
      if (exactMatch) {
        // Mostrar mensaje de error y detener la creación
        setProductNameError(`Ya existe un producto con el nombre "${productNameToUse}"`);
        setIsCreatingProduct(false);
        return;
      }
      
      // Si hay productos similares pero no exactos, proceder con la verificación normal
      const canProceed = await checkSimilarProductsBeforeCreate(productNameToUse);
      
      if (canProceed) {
        setIsCreatingProduct(true);
        const newProduct = await onCreateProduct({
          name: productNameToUse.trim(), // Asegurarse de guardar el nombre sin espacios extras
        });
        
        if (!newProduct) {
          toast.error("No se pudo crear el producto. Verifica que todos los campos estén completos.");
          setIsCreatingProduct(false);
          return;
        }
        
        setSelectedProduct(newProduct);
        handleAddItem(newProduct, true);
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
  };

  // Función para agregar un producto al ticket
  const handleAddItem = (product: Product | null = selectedProduct, isNewProduct: boolean = false) => {
    // Si hay un error en el nombre del producto, no proceder
    if (isQuickCreateMode && productNameError) {
      return;
    }
    
    if (isQuickCreateMode && !product) {
      handleCreateProduct();
      return;
    }

    onAddItem({
      product,
      productId: product ? product.id.toString() : "",
      quantity: Number(quantity),
      price: Number(price),
      description,
      isNewProduct,
      productName: isNewProduct ? (isQuickCreateMode ? newProductName : pendingProductName) : (product?.name || ""),
    });

    // Limpiar y cerrar
    onOpenChange(false);
  };

  // Función para seleccionar un producto existente de la sección de similares
  const selectExistingProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowSimilarProductsSection(false);
    
    // Auto-completar el precio si disponible para esta tienda
    if (storeId && product.prices_by_store && product.prices_by_store[parseInt(storeId)]) {
      setPrice(product.prices_by_store[parseInt(storeId)].toString());
    } else if (product.latest_price) {
      setPrice(product.latest_price.toString());
    }
  };

  // Función para validar el nombre del producto en tiempo real
  const checkProductName = React.useCallback(
    debounce(async (name: string) => {
      if (!name.trim()) {
        setProductNameError(null);
        return;
      }
      
      try {
        const storeIdNumber = storeId ? parseInt(storeId) : undefined;
        const results = await getProducts(storeIdNumber, name);
        
        const normalizedInputName = normalizeProductName(name);
        
        const exactMatch = results.find(
          (p: any) => normalizeProductName(p.name) === normalizedInputName
        );
        
        if (exactMatch) {
          setProductNameError(`Ya existe un producto con el nombre "${name}"`);
        } else {
          setProductNameError(null);
        }
      } catch (error) {
        console.error("Error al verificar el nombre del producto:", error);
      }
    }, 500),
    [getProducts, storeId]
  );
  
  // Llamar a la validación cuando cambia el nombre
  React.useEffect(() => {
    if (isQuickCreateMode && newProductName.trim().length >= 3) {
      checkProductName(newProductName);
    } else {
      setProductNameError(null);
    }
  }, [newProductName, isQuickCreateMode, checkProductName]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {showSimilarProductsSection ? "Productos similares encontrados" : "Agregar producto al ticket"}
          </DialogTitle>
        </DialogHeader>

        {showSimilarProductsSection ? (
          // Sección de productos similares
          <div className="space-y-4">
            <div className="border p-3 rounded-md bg-muted/30">
              <div className="flex items-center gap-1">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">
                  {isExactMatch 
                    ? "Ya existe un producto con este nombre exacto" 
                    : "Se encontraron productos similares"}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {isExactMatch
                  ? "Para evitar duplicados, te recomendamos usar el producto existente."
                  : "¿Quieres usar alguno de estos productos o prefieres crear uno nuevo?"}
              </p>
            </div>

            <ScrollArea className="h-[200px] rounded-md border p-2">
              <div className="space-y-2">
                {similarProductsFound.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-2 hover:bg-accent rounded-md cursor-pointer"
                    onClick={() => selectExistingProduct(product)}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{product.name}</span>
                      {product.brand?.name && (
                        <span className="text-xs text-muted-foreground">
                          {product.brand.name}
                        </span>
                      )}
                    </div>
                    {product.latest_price && (
                      <Badge variant="outline">
                        ${product.latest_price.toFixed(2)}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setShowSimilarProductsSection(false)}
              >
                Regresar
              </Button>
              <Button
                onClick={() => {
                  setShowSimilarProductsSection(false);
                  isQuickCreateMode 
                    ? setNewProductName(pendingProductName) 
                    : setPendingProductName("");
                }}
              >
                Crear nuevo de todas formas
              </Button>
            </div>
          </div>
        ) : (
          // Sección normal de búsqueda o creación de producto
          <>
            {!isQuickCreateMode ? (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar producto..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <ScrollArea className="h-[200px] rounded-md border">
                  {(searchTerm.length < 2 && !selectedProduct) ? (
                    <div className="flex flex-col items-center justify-center h-full p-4">
                      <p className="text-sm text-muted-foreground text-center">
                        Escribe al menos 2 caracteres para buscar productos
                      </p>
                      <div className="w-full border-t my-3"></div>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setNewProductName("");
                          setIsQuickCreateMode(true);
                        }}
                        className="mt-2 w-full max-w-[250px]"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Crear nuevo producto
                      </Button>
                    </div>
                  ) : (
                    <>
                      {filteredProducts.length > 0 ? (
                        <div className="p-2 space-y-1">
                          {filteredProducts.map((product) => (
                            <div
                              key={product.id}
                              className="flex items-center gap-2 p-2 cursor-pointer hover:bg-accent rounded-md"
                              onClick={() => {
                                setSelectedProduct(product);
                                
                                // Auto-completar precio si está disponible
                                if (storeId && product.prices_by_store && product.prices_by_store[parseInt(storeId)]) {
                                  setPrice(product.prices_by_store[parseInt(storeId)].toString());
                                } else if (product.latest_price) {
                                  setPrice(product.latest_price.toString());
                                }
                              }}
                            >
                              <span>{product.name}</span>
                              {product.brand?.name && (
                                <Badge variant="secondary" className="text-xs">
                                  {product.brand.name}
                                </Badge>
                              )}
                            </div>
                          ))}
                          
                          {/* Añadir opción para crear nuevo producto, incluso cuando hay resultados */}
                          <div className="border-t my-2 pt-2">
                            <Button 
                              variant="outline" 
                              onClick={() => {
                                setNewProductName(searchTerm);
                                setIsQuickCreateMode(true);
                              }}
                              className="w-full"
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Crear nuevo producto
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center py-4 gap-2">
                          {isSearching ? (
                            <div className="flex flex-col items-center gap-2">
                              <Loader2 className="h-6 w-6 animate-spin" />
                              <p className="text-sm text-muted-foreground">Buscando productos...</p>
                              
                              {/* Añadir opción para crear incluso durante la búsqueda */}
                              <div className="w-full border-t my-3"></div>
                              <Button 
                                variant="outline" 
                                onClick={() => {
                                  setNewProductName(searchTerm);
                                  setIsQuickCreateMode(true);
                                }}
                                className="mt-1"
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Crear nuevo producto
                              </Button>
                            </div>
                          ) : searchTerm.length >= 2 ? (
                            <>
                              <p className="text-sm text-muted-foreground">No se encontraron productos</p>
                              <Button 
                                variant="outline" 
                                onClick={() => {
                                  setNewProductName(searchTerm);
                                  setIsQuickCreateMode(true);
                                }}
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Crear "{searchTerm}"
                              </Button>
                            </>
                          ) : (
                            <div className="flex flex-col items-center gap-3 px-4">
                              <p className="text-sm text-muted-foreground text-center">
                                Escribe al menos 2 caracteres para buscar productos
                              </p>
                              <div className="w-full border-t my-2"></div>
                              <p className="text-sm font-medium">¿No encuentras lo que buscas?</p>
                              <Button 
                                variant="outline" 
                                onClick={() => {
                                  setNewProductName("");
                                  setIsQuickCreateMode(true);
                                }}
                                className="w-full"
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Crear nuevo producto
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </ScrollArea>

                {selectedProduct && (
                  <div className="space-y-4 pt-4 border-t">
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
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Input
                      value={newProductName}
                      onChange={(e) => setNewProductName(e.target.value)}
                      placeholder="Nombre del producto"
                      className={`flex-1 ${productNameError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                      onBlur={() => {
                        if (newProductName.trim()) {
                          checkProductName(newProductName);
                        }
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsQuickCreateMode(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  {productNameError && (
                    <div className="text-red-400 dark:text-red-300 text-sm flex items-center gap-1 px-1 my-1 bg-red-50/10 p-1 rounded-sm">
                      <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                      <span>{productNameError}</span>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label>Cantidad</label>
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label>Precio unitario</label>
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
                  <label>Descripción (opcional)</label>
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ej: Oferta 2x1, Con descuento, etc."
                  />
                </div>
              </div>
            )}
          </>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={() => handleAddItem()}
            disabled={
              isQuickCreateMode
                ? !newProductName || !quantity || !price || isCreatingProduct || !!productNameError
                : !selectedProduct || !quantity || !price
            }
          >
            {isCreatingProduct ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando...
              </>
            ) : (
              "Agregar al ticket"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 