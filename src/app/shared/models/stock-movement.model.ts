export type MovementType = 'ENTRADA' | 'SALIDA' | 'AJUSTE_INICIAL' | 'CORRECCION';

export interface StockMovement {
  id: number; // Coincide con Long del backend
  productId: number;
  productName: string;
  type: MovementType;
  quantityChanged: number; // Positivo para entrada, negativo para salida
  stockBefore: number;
  stockAfter: number;
  movementDate: string; // ISO Date string desde el backend (LocalDateTime)
  reason?: string;
  username?: string; // Nombre del usuario que hizo el movimiento
}
