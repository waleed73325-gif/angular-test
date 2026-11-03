export type RequestStatus = 'Draft' | 'Submitted' | 'Delivered';

export interface EquipmentRequest {
  id: string;
  requestNumber: string;
  employeeName: string;
  departmentId: string;
  item: string;
  quantity: number;
  estimatedCost: number;
  neededOn: string;
  status: RequestStatus;
  reason: string;
}

