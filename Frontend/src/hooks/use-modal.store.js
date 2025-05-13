import { create } from 'zustand';

export const useModal = create((set) => ({
  type: null, // Modal type: 'createServer', 'invite', 'editServer', etc.
  data: {},   // You can include server or other modal-related data
  isOpen: false,
  openModal: (type, data = {}) => set({ type, isOpen: true, data }),
  closeModal: () => set({ type: null, isOpen: false, data: {} }),
}));
