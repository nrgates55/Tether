import { db } from "../database/db";

import type {
    Person,
    Preference,
    PreferenceType,
    CreatePersonInput,
    UpdatePersonInput
} from "../models/Person";

function validateName(name: string): string {
    const cleaned = name.trim();

    if (!cleaned) {
        throw new Error("A person's name cannot be empty.");
    }

    if (cleaned.length > 100) {
        throw new Error("A person's name cannot exceed 100 characters.");
    }

    return cleaned;
}

function validatePositiveNumber(
    value: number | null | undefined,
    field: string
): number | null {

    if (value == null) {
        return null;
    }

    if (!Number.isFinite(value) || value <= 0) {
        throw new Error(`${field} must be a positive number.`);
    }

    return value;
}

function validateRating(
    rating: number | null | undefined
): number | null {

    if (rating == null) {
        return null;
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        throw new Error("Rating must be a whole number between 1 and 5.");
    }

    return rating;
}
export async function createPerson(
    input: CreatePersonInput
): Promise<Person> {

    const now = Date.now();

    const person: Person = {
        id: crypto.randomUUID(),

        name: validateName(input.name),

        email: input.email?.trim() ?? "",
        phone: input.phone?.trim() ?? "",

        heightCm: validatePositiveNumber(
            input.heightCm,
            "Height"
        ),

        weightKg: validatePositiveNumber(
            input.weightKg,
            "Weight"
        ),

        description: input.description?.trim() ?? "",
        notes: input.notes ?? "",

        rating: validateRating(input.rating),

        preferences: [],

        createdAt: now,
        updatedAt: now
    };

    await db.people.add(person);

    return person;
}

export async function getAllPeople(): Promise<Person[]> {
    return await db.people
        .orderBy("name")
        .toArray();
}

export async function getPerson(
    id: string
): Promise<Person | undefined> {

    return await db.people.get(id);
}

export async function updatePerson(
    id: string,
    changes: UpdatePersonInput
): Promise<Person> {

    return await db.transaction("rw", db.people, async () => {

        const existing = await db.people.get(id);

        if (!existing) {
            throw new Error("Person not found.");
        }

        const cleaned: UpdatePersonInput = { ...changes };

        if (changes.name !== undefined) {
            cleaned.name = validateName(changes.name);
        }

        if (changes.email !== undefined) {
            cleaned.email = changes.email.trim();
        }

        if (changes.phone !== undefined) {
            cleaned.phone = changes.phone.trim();
        }

        if (changes.description !== undefined) {
            cleaned.description = changes.description.trim();
        }

        if (changes.heightCm !== undefined) {
            cleaned.heightCm = validatePositiveNumber(
                changes.heightCm,
                "Height"
            );
        }

        if (changes.weightKg !== undefined) {
            cleaned.weightKg = validatePositiveNumber(
                changes.weightKg,
                "Weight"
            );
        }

        if (changes.rating !== undefined) {
            cleaned.rating = validateRating(changes.rating);
        }

        const updated: Person = {
            ...existing,
            ...cleaned,
            updatedAt: Date.now()
        };

        await db.people.put(updated);

        return updated;
    });
}

export async function deletePerson(
    id: string
): Promise<void> {

    await db.people.delete(id);
}

export async function searchPeople(
    query: string
): Promise<Person[]> {

    const searchTerm = query.trim().toLowerCase();

    if (!searchTerm) {
        return getAllPeople();
    }

    return await db.people
        .filter(person =>
            person.name.toLowerCase().includes(searchTerm)
        )
        .toArray();
}

export async function addPreference(
    personId: string,
    label: string,
    type: PreferenceType
): Promise<Preference> {

    const cleanedLabel = label.trim();

    if (!cleanedLabel) {
        throw new Error("Preference cannot be empty.");
    }

    if (!["like", "dislike", "neutral"].includes(type)) {
        throw new Error("Invalid preference type.");
    }

    const preference: Preference = {
        id: crypto.randomUUID(),
        label: cleanedLabel,
        type
    };

    await db.transaction("rw", db.people, async () => {

        const person = await db.people.get(personId);

        if (!person) {
            throw new Error("Person not found.");
        }

        const preferences = person.preferences ?? [];

        await db.people.update(personId, {
            preferences: [...preferences, preference],
            updatedAt: Date.now()
        });
    });

    return preference;
}

export async function removePreference(
    personId: string,
    preferenceId: string
): Promise<void> {

    await db.transaction("rw", db.people, async () => {

        const person = await db.people.get(personId);

        if (!person) {
            throw new Error("Person not found.");
        }

        const updatedPreferences = (
            person.preferences ?? []
        ).filter(
            preference => preference.id !== preferenceId
        );

        await db.people.update(personId, {
            preferences: updatedPreferences,
            updatedAt: Date.now()
        });
    });
}