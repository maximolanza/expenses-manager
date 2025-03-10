"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Loader2, Plus } from "lucide-react"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { Badge } from "@/components/ui/badge"
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LabelList 
} from 'recharts'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useWorkspace } from "@/components/providers/workspace-provider"
import { useSupabase } from "@/components/providers/supabase-provider"
import { v4 as uuidv4 } from 'uuid'

export interface PriceHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productId: number
  productName: string
}

export function PriceHistoryDialog({
  open,
  onOpenChange,
  productId,
  productName,
}: PriceHistoryDialogProps) {
  const { workspace } = useWorkspace()
  const { user } = useSupabase()
  const [priceHistory, setPriceHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [chartData, setChartData] = useState<any[]>([])
  const [storeColors, setStoreColors] = useState<Record<string, string>>({})
  
  // Estados para el formulario de nuevo precio
  const [showAddForm, setShowAddForm] = useState(false)
  const [stores, setStores] = useState<any[]>([])
  const [selectedStore, setSelectedStore] = useState<string>("")
  const [newPrice, setNewPrice] = useState<string>("")
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [isDiscount, setIsDiscount] = useState<boolean>(false)
  const [discountEndDate, setDiscountEndDate] = useState<Date | undefined>(undefined)
  const [addingPrice, setAddingPrice] = useState<boolean>(false)

  // Cargar historial de precios y tiendas cuando se abre el diálogo
  useEffect(() => {
    if (open && productId) {
      loadPriceHistory()
      loadStores()
    }
  }, [open, productId])

  // Función para cargar tiendas disponibles
  const loadStores = async () => {
    try {
      const { data, error } = await supabase
        .from("stores")
        .select("id, name")
        .order("name")
      
      if (error) throw error
      
      setStores(data || [])
    } catch (error) {
      console.error("Error al cargar tiendas:", error)
      toast.error("No se pudieron cargar las tiendas")
    }
  }

  // Función para cargar el historial de precios
  const loadPriceHistory = async () => {
    setLoading(true)
    try {
      // Consultar historial de precios ordenados por fecha
      const { data, error } = await supabase
        .from("product_price_history")
        .select(`
          id, 
          price, 
          date,
          is_discount,
          discount_end_date,
          store:stores(id, name)
        `)
        .eq("product_id", productId)
        .order("date", { ascending: false })
      
      if (error) throw error
      
      console.log("Historial de precios cargado:", data);
      setPriceHistory(data || [])

      // Procesar datos para el gráfico
      processChartData(data || [])
    } catch (error) {
      console.error("Error al cargar historial de precios:", error)
      toast.error("No se pudo cargar el historial de precios")
    } finally {
      setLoading(false)
    }
  }

  // Procesar datos para el gráfico de líneas
  const processChartData = (data: any[]) => {
    if (!data || data.length === 0) {
      setChartData([]);
      setStoreColors({});
      return;
    }

    console.log("Datos originales para el gráfico:", data);

    // Ordenar los datos por fecha e ID (para mantener el orden de inserción)
    // Esto ayuda a que los registros más recientes estén al final
    const sortedData = [...data].sort((a, b) => {
      const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateCompare !== 0) return dateCompare;
      return a.id - b.id; // Si las fechas son iguales, ordenar por ID (asume que IDs más altos son más recientes)
    });

    // Extraer todas las tiendas únicas
    const uniqueStores: Set<string> = new Set();
    sortedData.forEach(item => {
      const storeName = item.store?.name || 'Desconocido';
      uniqueStores.add(storeName);
    });

    // Asignar colores vividos y distintivos a cada tienda
    const stores: Record<string, string> = {};
    const colors = [
      "#2196F3", // Azul
      "#F44336", // Rojo
      "#4CAF50", // Verde
      "#FF9800", // Naranja
      "#9C27B0", // Púrpura
      "#795548", // Marrón
      "#009688", // Verde azulado
      "#673AB7", // Violeta
      "#E91E63", // Rosa
      "#CDDC39"  // Lima
    ];

    // Asignar colores a cada tienda única
    Array.from(uniqueStores).forEach((storeName, index) => {
      stores[storeName] = colors[index % colors.length];
    });
    
    console.log("Tiendas únicas y sus colores:", stores);
    setStoreColors(stores);

    // Obtener todas las fechas únicas ordenadas
    const allDates = new Set<string>();
    sortedData.forEach(record => {
      const dateStr = format(new Date(record.date), 'dd/MM/yyyy');
      allDates.add(dateStr);
    });
    
    // Convertir a array y ordenar cronológicamente
    const sortedDates = Array.from(allDates).sort((a, b) => {
      const dateA = new Date(a.split('/').reverse().join('-'));
      const dateB = new Date(b.split('/').reverse().join('-'));
      return dateA.getTime() - dateB.getTime();
    });
    
    // Crear estructura de datos para el gráfico
    const chartDataArray = sortedDates.map(dateStr => {
      const dataPoint: Record<string, any> = { date: dateStr };
      
      // Añadir datos para cada tienda en esta fecha
      Array.from(uniqueStores).forEach(storeName => {
        // Filtrar todos los registros para esta tienda en esta fecha
        const matchingRecords = sortedData.filter(record => 
          format(new Date(record.date), 'dd/MM/yyyy') === dateStr && 
          record.store?.name === storeName
        );
        
        if (matchingRecords.length > 0) {
          // Priorizar: 1) con descuento, 2) el último registrado
          let selectedRecord;
          
          // Primero intentar encontrar uno con descuento
          const discountRecords = matchingRecords.filter(r => r.is_discount);
          
          if (discountRecords.length > 0) {
            // Si hay varios con descuento, tomar el último
            selectedRecord = discountRecords[discountRecords.length - 1];
          } else {
            // Si no hay con descuento, tomar el último registrado
            selectedRecord = matchingRecords[matchingRecords.length - 1];
          }
          
          // Guardar el precio
          dataPoint[storeName] = parseFloat(selectedRecord.price);
          
          // Guardar si es descuento en un campo adicional
          dataPoint[`${storeName}_isDiscount`] = selectedRecord.is_discount;
        }
      });
      
      return dataPoint;
    });
    
    console.log("Datos procesados para el gráfico:", chartDataArray);
    setChartData(chartDataArray);
  }

  // Componente personalizado para las etiquetas de precios con fondo blanco
  const CustomPriceLabel = (props: any) => {
    const { x, y, value } = props;
    
    if (!value) return null;
    
    return (
      <g>
        {/* Fondo blanco con borde suave */}
        <rect
          x={x - 22}
          y={y - 20}
          width={50}
          height={20}
          className="fill-card stroke-border"
          strokeWidth={1}
          rx={4}
          ry={4}
        />
        {/* Texto adaptable al tema */}
        <text
          x={x}
          y={y - 8}
          textAnchor="middle"
          className="fill-foreground font-medium"
          fontSize={12}
        >
          ${value}
        </text>
      </g>
    );
  };

  // Componente personalizado para el tooltip que muestra los precios de todas las tiendas
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    
    // Obtener todas las tiendas únicas
    const stores = Object.keys(storeColors);
    
    // Convertir la fecha del tooltip a Date para comparaciones
    const currentDate = label.split('/').reverse().join('-');
    
    return (
      <div className="bg-popover text-popover-foreground p-3 border border-border rounded-md shadow-sm max-w-[250px]">
        <p className="font-medium mb-2">{`Fecha: ${label}`}</p>
        <div className="space-y-2">
          {stores.map(store => {
            // Buscar el valor para esta tienda en la fecha actual
            const storeData = payload.find((p: { dataKey: string; value: number }) => p.dataKey === store);
            const value = storeData ? storeData.value : null;
            const color = storeColors[store];
            
            if (value !== null) {
              // Si hay un valor para esta fecha, mostrarlo normalmente
              const isDiscount = payload[0] && payload[0].payload ? 
                !!payload[0].payload[`${store}_isDiscount`] : false;
                
              return (
                <div key={store} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-sm font-medium">
                    {store}: <span className="text-foreground">${value}</span>
                    {isDiscount && (
                      <span className="ml-1 text-xs text-destructive font-medium">
                        (Descuento)
                      </span>
                    )}
                  </span>
                </div>
              );
            } else {
              // Si no hay valor para esta fecha, buscar el valor previo más cercano
              const prevValue = findPreviousValue(store, currentDate);
              
              if (prevValue) {
                return (
                  <div key={store} className="flex items-start gap-2">
                    <div 
                      className="w-3 h-3 rounded-full mt-1" 
                      style={{ backgroundColor: color }}
                    />
                    <div>
                      <span className="text-sm font-medium">
                        {store}: <span className="text-foreground">${prevValue.price}</span>
                        {prevValue.isDiscount && (
                          <span className="ml-1 text-xs text-destructive font-medium">
                            (Descuento)
                          </span>
                        )}
                      </span>
                      <div className="text-xs text-muted-foreground">
                        Último registro: {format(new Date(prevValue.date), 'dd/MM/yyyy')}
                      </div>
                    </div>
                  </div>
                );
              } else {
                return (
                  <div key={store} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-sm text-muted-foreground">
                      {store}: Sin registros previos
                    </span>
                  </div>
                );
              }
            }
          })}
        </div>
      </div>
    );
  };

  // Función para encontrar el valor previo más cercano de una tienda
  const findPreviousValue = (storeName: string, currentDate: string) => {
    // Filtrar el historial para obtener solo los registros de esta tienda
    const storeRecords = priceHistory.filter(
      record => record.store?.name === storeName
    );
    
    if (storeRecords.length === 0) return null;
    
    // Agrupar registros por fecha
    const recordsByDate: Record<string, any[]> = {};
    
    storeRecords.forEach(record => {
      const dateStr = format(new Date(record.date), 'yyyy-MM-dd');
      if (!recordsByDate[dateStr]) {
        recordsByDate[dateStr] = [];
      }
      recordsByDate[dateStr].push(record);
    });
    
    // Para cada fecha, seleccionar el registro prioritario (con descuento o el último)
    const prioritizedRecords: any[] = [];
    
    Object.entries(recordsByDate).forEach(([dateStr, records]) => {
      // Ordenar por ID para asegurar que los más recientes estén al final
      const sortedRecords = [...records].sort((a, b) => a.id - b.id);
      
      // Priorizar registros con descuento
      const discountRecords = sortedRecords.filter(r => r.is_discount);
      
      if (discountRecords.length > 0) {
        // Si hay varios con descuento, tomar el último
        prioritizedRecords.push(discountRecords[discountRecords.length - 1]);
      } else {
        // Si no hay con descuento, tomar el último registrado
        prioritizedRecords.push(sortedRecords[sortedRecords.length - 1]);
      }
    });
    
    // Ordenar por fecha descendente (más reciente primero)
    const sortedPrioritizedRecords = prioritizedRecords.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    // Encontrar el registro más reciente anterior a la fecha actual
    const prevRecord = sortedPrioritizedRecords.find(
      record => new Date(record.date).getTime() <= new Date(currentDate).getTime()
    );
    
    if (!prevRecord) return null;
    
    return {
      price: parseFloat(prevRecord.price),
      date: prevRecord.date,
      isDiscount: prevRecord.is_discount
    };
  };

  // Función para agregar un nuevo precio al historial
  const handleAddPrice = async () => {
    // Validación básica de formulario
    if (!selectedStore) {
      toast.error("Por favor, selecciona una tienda");
      return;
    }
    
    if (!newPrice || parseFloat(newPrice) <= 0) {
      toast.error("Por favor, ingresa un precio válido mayor que 0");
      return;
    }
    
    setAddingPrice(true);
    
    try {
      // Obtener el UUID del usuario actual o generar uno si no está disponible
      const currentUserId = user?.id || uuidv4();
      
      // Inserción con UUID válido para recorded_by
      const insertResult = await supabase
        .from("product_price_history")
        .insert({
          product_id: productId,
          store_id: parseInt(selectedStore),
          price: parseFloat(newPrice),
          date: selectedDate.toISOString(),
          is_discount: isDiscount,
          recorded_by: currentUserId, // UUID válido del usuario o generado
          price_change_type: "regular", // Valor permitido según la restricción
          workspace_id: 1
        });
      
      if (insertResult.error) {
        // Manejo seguro del error
        const errorMessage = insertResult.error.message || "Error desconocido";
        console.log("Error al insertar:", errorMessage);
        toast.error(`No se pudo guardar el precio: ${errorMessage}`);
        setAddingPrice(false);
        return;
      }
      
      // Ya no actualizamos la tabla de productos porque no tiene la columna 'prices_by_store'
      
      // Mensaje de éxito
      toast.success("Precio registrado correctamente");
      
      // Reiniciar formulario
      setSelectedStore("");
      setNewPrice("");
      setSelectedDate(new Date());
      setIsDiscount(false);
      setDiscountEndDate(undefined);
      setShowAddForm(false);
      
      // Recargar datos
      loadPriceHistory();
    } catch (error) {
      // Manejo global de errores
      console.log("Error general:", error);
      toast.error("Ocurrió un error inesperado");
    } finally {
      setAddingPrice(false);
    }
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "PPP", { locale: es })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex flex-col space-y-2">
            <div>
              <DialogTitle>Historial de Precios</DialogTitle>
              <DialogDescription>
                Historial de cambios de precio para {productName}
              </DialogDescription>
            </div>
            <div className="flex justify-end">
              <Button 
                size="sm" 
                variant={showAddForm ? "secondary" : "default"}
                onClick={() => setShowAddForm(!showAddForm)}
                className="mr-6"
              >
                <Plus className="h-4 w-4 mr-1" />
                {showAddForm ? "Cancelar" : "Agregar Precio"}
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Formulario para agregar nuevo precio */}
        {showAddForm && (
          <div className="mb-4 p-4 border rounded-md bg-muted/50">
            <h3 className="text-sm font-medium mb-3">Agregar Nuevo Precio</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="store">Tienda <span className="text-red-500">*</span></Label>
                <Select value={selectedStore} onValueChange={setSelectedStore}>
                  <SelectTrigger id="store" className={!selectedStore ? "text-muted-foreground" : ""}>
                    <SelectValue placeholder="Seleccionar tienda" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map(store => (
                      <SelectItem key={store.id} value={store.id.toString()}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Precio <span className="text-red-500">*</span></Label>
                <Input
                  id="price"
                  type="number"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="date">Fecha de registro</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <span>{format(selectedDate, "PPP", { locale: es })}</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      initialFocus
                      locale={es}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 h-10 mt-6">
                  <Switch
                    id="discount"
                    checked={isDiscount}
                    onCheckedChange={setIsDiscount}
                  />
                  <Label htmlFor="discount">Es un descuento</Label>
                </div>
              </div>
            </div>
            
            {isDiscount && (
              <div className="mt-2 mb-4">
                <Label htmlFor="discountEndDate">Válido hasta</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal mt-2"
                    >
                      {discountEndDate ? (
                        <span>{format(discountEndDate, "PPP", { locale: es })}</span>
                      ) : (
                        <span className="text-muted-foreground">Seleccionar fecha de fin de descuento</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={discountEndDate}
                      onSelect={setDiscountEndDate}
                      initialFocus
                      locale={es}
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
            
            <div className="flex justify-end">
              <Button 
                onClick={handleAddPrice} 
                disabled={!selectedStore || !newPrice || addingPrice}
              >
                {addingPrice ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar Precio"
                )}
              </Button>
            </div>
          </div>
        )}

        <div className="py-4 overflow-y-auto max-h-[calc(80vh-120px)]">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <>
              {/* Gráfico de evolución de precios */}
              {chartData.length > 0 && (
                <div className="mb-6 border rounded-lg p-4">
                  <h3 className="text-base font-semibold mb-4">Evolución de precios por tienda</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={chartData}
                        margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(tick) => tick.split('/').slice(0, 2).join('/')}
                        />
                        <YAxis domain={['dataMin - 5', 'dataMax + 5']} />
                        <Tooltip 
                          content={<CustomTooltip />}
                        />
                        <Legend verticalAlign="bottom" height={36} />
                        {Object.keys(storeColors).map(store => (
                          <Line
                            key={store}
                            type="monotone"
                            dataKey={store}
                            name={store}
                            stroke={storeColors[store]}
                            strokeWidth={2}
                            dot={{ r: 4, strokeWidth: 2 }}
                            activeDot={{ r: 8 }}
                            isAnimationActive={true}
                            connectNulls={true}
                          >
                            <LabelList
                              position="top"
                              offset={12}
                              className="fill-foreground bg-white text-black border border-gray-200 rounded-md p-2"
                              fontSize={12}
                            />

                            <LabelList
                              position="top"
                              offset={12}
                              fill="var(--foreground)"
                              fontSize={12}
                              formatter={(value: number | null) => value && `$${value}`}
                              content={CustomPriceLabel}
                            />
                          </Line>
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
              
              {/* Lista de registros históricos de precios */}
              {priceHistory.length > 0 ? (
                <div className="space-y-3">
                  {priceHistory.map((record) => (
                    <Card key={record.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-medium">${parseFloat(record.price).toFixed(2)}</span>
                            {record.is_discount && (
                              <Badge variant="destructive" className="ml-2">
                                Descuento
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {record.store ? `Registrado en ${record.store.name}` : "Tienda no especificada"}
                          </div>
                          {record.discount_end_date && (
                            <div className="text-sm mt-1">
                              <span className="font-medium">Válido hasta:</span> {formatDate(record.discount_end_date)}
                            </div>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(record.date)}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center p-6 text-muted-foreground">
                  No hay registros de precio para este producto
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 