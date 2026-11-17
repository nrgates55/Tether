export type PreferenceType = "like" | "dislike" | "neutral";

export interface Preference {
    id: string;
    label: string;
    type: PreferenceType;
}

export interface Person {
    // Identification
    id: string;
    name: string;

    // Contact information
    email?: string;
    phone?: string;

    // Physical information
    heightCm?: number | null;
    weightKg?: number | null;

    // Personal information
    description?: string;
    notes: string;

    // Rating
    rating?: number | null;

    // Preferences
    preferences?: Preference[];

    // Metadata
    createdAt: number;
    updatedAt?: number;
}

export interface CreatePersonInput {
    name: string;

    email?: string;
    phone?: string;

    heightCm?: number | null;
    weightKg?: number | null;

    description?: string;
    notes?: string;

    rating?: number | null;
}

export type UpdatePersonInput = Partial<CreatePersonInput>;