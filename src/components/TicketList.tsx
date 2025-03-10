import React, { useState } from 'react';
import './TicketList.css';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    Calendar, 
    CreditCard, 
    Store, 
    MapPin, 
    Package, 
    ChevronDown, 
    ChevronUp, 
    Edit, 
    Trash,
    Plus,
    Receipt
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Definition of types for tickets and products
interface Product {
    id: number;
    ticket_id: number;
    name: string;
    price: number;
    quantity: number;
}

interface Ticket {
    id: number;
    workspace_id: number;
    user_id: string;
    store_id: number | null;
    store_name?: string;
    store_category?: string;
    store_location?: string;
    date: string;
    payment_method: string;
    installments?: number;
    current_installment?: number;
}

interface TicketListProps {
    tickets: Ticket[];
    products: Product[];
    isLoading?: boolean;
    onEdit?: (ticketId: number) => void;
    onDelete?: (ticketId: number) => void;
    onAddTicket?: () => void;
}

const TicketList: React.FC<TicketListProps> = ({ 
    tickets, 
    products, 
    isLoading = false,
    onEdit,
    onDelete,
    onAddTicket
}) => {
    const [expandedTicketId, setExpandedTicketId] = useState<number | null>(null);

    const toggleAccordion = (ticketId: number) => {
        setExpandedTicketId(expandedTicketId === ticketId ? null : ticketId);
    };

    const handleEdit = (e: React.MouseEvent, ticketId: number) => {
        e.stopPropagation(); // Prevent triggering the accordion
        if (onEdit) onEdit(ticketId);
    };

    const handleDelete = (e: React.MouseEvent, ticketId: number) => {
        e.stopPropagation(); // Prevent triggering the accordion
        if (onDelete) onDelete(ticketId);
    };

    const calculateProductCountAndTotal = (ticketId: number) => {
        const ticketProducts = products.filter(product => product.ticket_id === ticketId);
        const count = ticketProducts.length;
        const total = ticketProducts.reduce((sum, product) => sum + (product.price * (product.quantity || 1)), 0);
        return { count, total, products: ticketProducts };
    };

    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), 'dd/MM/yyyy', { locale: es });
        } catch (error) {
            return dateString;
        }
    };

    if (isLoading) {
        return <div className="loading-state">Cargando tickets...</div>;
    }

    if (!tickets.length) {
        return (
            <div className="empty-state flex flex-col items-center justify-center p-8 text-center">
                <div className="mb-4 rounded-full bg-muted p-3">
                    <Receipt className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">No hay tickets disponibles</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                    Comienza agregando tu primer ticket de compra
                </p>
                {onAddTicket && (
                    <Button onClick={onAddTicket}>
                        <Plus className="mr-2 h-4 w-4" />
                        Nuevo Ticket
                    </Button>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
                {tickets.map(ticket => {
                    const { count, total, products: ticketProducts } = calculateProductCountAndTotal(ticket.id);
                    const isExpanded = expandedTicketId === ticket.id;
                    
                    return (
                        <Card key={ticket.id} className="overflow-hidden">
                            <CardHeader 
                                className="cursor-pointer pb-2" 
                                onClick={() => toggleAccordion(ticket.id)}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-xl">
                                            {ticket.store_name || "Disco"}
                                        </CardTitle>
                                        {ticket.store_category && (
                                            <Badge variant="outline" className="mt-1">
                                                {ticket.store_category}
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold">${total.toFixed(2)}</div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pb-3 pt-0">
                                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                    <div className="flex items-center">
                                        <Calendar className="mr-2 h-4 w-4" />
                                        {formatDate(ticket.date)}
                                    </div>
                                    <div className="flex items-center">
                                        <CreditCard className="mr-2 h-4 w-4" />
                                        {ticket.payment_method === "Credito" 
                                            ? `Crédito (${ticket.current_installment || 1}/${ticket.installments || 1})`
                                            : "Débito"
                                        }
                                    </div>
                                    {ticket.store_location && (
                                        <div className="flex items-center">
                                            <MapPin className="mr-2 h-4 w-4" />
                                            {ticket.store_location}
                                        </div>
                                    )}
                                </div>
                                
                                {!isExpanded && ticketProducts.length > 0 && (
                                    <div className="mt-3 space-y-1">
                                        {ticketProducts.slice(0, 2).map((product, idx) => (
                                            <div key={idx} className="flex items-center text-sm">
                                                <Package className="mr-2 h-4 w-4 text-muted-foreground" />
                                                <span>{product.name || `Producto #${product.id}`}</span>
                                                <span className="ml-2 text-muted-foreground">
                                                    ({product.quantity || 1} x ${product.price.toFixed(2)})
                                                </span>
                                            </div>
                                        ))}
                                        {ticketProducts.length > 2 && (
                                            <div className="text-sm text-muted-foreground">
                                                + {ticketProducts.length - 2} productos más
                                            </div>
                                        )}
                                    </div>
                                )}
                                
                                {isExpanded && (
                                    <div className="mt-4 space-y-4">
                                        <div>
                                            <h4 className="mb-2 font-medium">Productos</h4>
                                            <div className="space-y-2">
                                                {ticketProducts.map((product, idx) => (
                                                    <div 
                                                        key={idx} 
                                                        className="flex items-center justify-between rounded-md border p-2"
                                                    >
                                                        <div className="flex items-center">
                                                            <Package className="mr-2 h-4 w-4 text-muted-foreground" />
                                                            <span>{product.name || `Producto #${product.id}`}</span>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <span className="text-sm text-muted-foreground">
                                                                {product.quantity || 1} x ${product.price.toFixed(2)}
                                                            </span>
                                                            <span className="font-medium">
                                                                ${((product.quantity || 1) * product.price).toFixed(2)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        
                                        <div className="flex justify-between border-t pt-2">
                                            <span className="font-medium">Total</span>
                                            <span className="font-bold">${total.toFixed(2)}</span>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter className="flex justify-between border-t bg-muted/30 px-6 py-3">
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => toggleAccordion(ticket.id)}
                                >
                                    {isExpanded ? (
                                        <>
                                            <ChevronUp className="mr-2 h-4 w-4" />
                                            Ocultar detalles
                                        </>
                                    ) : (
                                        <>
                                            <ChevronDown className="mr-2 h-4 w-4" />
                                            Ver detalles
                                        </>
                                    )}
                                </Button>
                                <div className="flex gap-2">
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={(e) => handleEdit(e, ticket.id)}
                                    >
                                        <Edit className="h-4 w-4 mr-1" />
                                        Editar
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        className="text-destructive"
                                        onClick={(e) => handleDelete(e, ticket.id)}
                                    >
                                        <Trash className="h-4 w-4 mr-1" />
                                        Borrar
                                    </Button>
                                </div>
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};

export default TicketList; 