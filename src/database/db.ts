import Dexie, { type EntityTable } from "dexie";

import type { Person } from "../models/Person";

export const db = new Dexie("TetherDatabase") as Dexie & {
    people: EntityTable<Person, "id">;
};

db.version(1).stores({
    people: "id, name, createdAt"
});