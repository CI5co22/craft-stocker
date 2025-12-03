import { Material } from '../types';

interface InventoryData {
    materials: Material[];
    categories: string[];
}

export const storageService = {
    /**
     * Uploads an image to Vercel Blob
     */
    async uploadImage(file: File): Promise<string> {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Failed to upload image');
        }

        const blob = await response.json();
        return blob.url;
    },

    /**
     * Loads the entire inventory from Vercel Blob
     */
    async getInventory(): Promise<InventoryData | null> {
        try {
            const response = await fetch('/api/inventory');
            if (!response.ok) {
                if (response.status === 404) return null;
                throw new Error('Failed to fetch inventory');
            }
            return await response.json();
        } catch (error) {
            console.error('Error loading inventory:', error);
            return null;
        }
    },

    /**
     * Saves the entire inventory to Vercel Blob
     */
    async saveInventory(data: InventoryData): Promise<void> {
        const response = await fetch('/api/inventory', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error('Failed to save inventory');
        }
    }
};
