import fs from "fs";
import path from "path";

type DB = Record<string, any[]>;

const DB_PATH = path.join(process.cwd(), "supabase", "mock", "db.json");

function loadDb(): DB {
  if (!fs.existsSync(DB_PATH)) {
    return {};
  }
  const raw = fs.readFileSync(DB_PATH, "utf-8");
  const parsed = JSON.parse(raw);

  // Replace any placeholder publication_date = "TODAY" with actual date
  const today = new Date().toISOString().slice(0, 10);
  if (Array.isArray(parsed.puzzles)) {
    parsed.puzzles = parsed.puzzles.map((p: any) => ({
      ...p,
      publication_date:
        p.publication_date === "TODAY"
          ? today
          : p.publication_date,
    }));
  }

  return parsed;
}

export function createMockClient() {
  const db = loadDb();

  function saveDb() {
    try {
      fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
    } catch (e) {
      // ignore write errors in environments where fs is read-only
    }
  }

  function cloneRow(row: any) {
    return JSON.parse(JSON.stringify(row));
  }

  class Query {
    table: string;
    rows: any[];

    constructor(table: string) {
      this.table = table;
      this.rows = Array.isArray(db[table]) ? db[table].map(cloneRow) : [];
    }

    select(_: string) {
      // ignore projection and return full objects
      return this;
    }

    eq(field: string, value: any) {
      this.rows = this.rows.filter((r) => r[field] === value);
      return this;
    }

    in(field: string, values: any[]) {
      this.rows = this.rows.filter((r) => values.includes(r[field]));
      return this;
    }

    order(field: string, _opts?: { ascending?: boolean; nullsFirst?: boolean }) {
      this.rows.sort((a, b) => {
        const av = a[field];
        const bv = b[field];
        if (av == null && bv == null) return 0;
        if (av == null) return -1;
        if (bv == null) return 1;
        if (av < bv) return -1;
        if (av > bv) return 1;
        return 0;
      });
      return this;
    }

    // update the matched rows with given values
    update(values: Record<string, any>) {
      if (!Array.isArray(db[this.table])) {
        db[this.table] = [];
      }

      const updated: any[] = [];
      const tableRows = db[this.table];

      this.rows.forEach((r) => {
        const idx = tableRows.findIndex((tr) => tr.id === r.id);
        if (idx !== -1) {
          tableRows[idx] = { ...tableRows[idx], ...values, updated_at: new Date().toISOString() };
          updated.push(cloneRow(tableRows[idx]));
        }
      });

      saveDb();

      this.rows = updated.map(cloneRow);
      return this;
    }

    // insert one or multiple rows
    insert(values: any | any[]) {
      if (!Array.isArray(db[this.table])) {
        db[this.table] = [];
      }
      const tableRows = db[this.table];
      const toInsert = Array.isArray(values) ? values : [values];
      const inserted: any[] = [];
      const maxId = tableRows.reduce((acc, cur) => (typeof cur.id === "number" && cur.id > acc ? cur.id : acc), 0);
      let nextId = maxId + 1;

      toInsert.forEach((row) => {
        const newRow = { ...row };
        if (newRow.id == null) {
          newRow.id = nextId++;
        }
        if (!newRow.created_at) newRow.created_at = new Date().toISOString();
        if (!newRow.updated_at) newRow.updated_at = new Date().toISOString();
        tableRows.push(newRow);
        inserted.push(cloneRow(newRow));
      });

      saveDb();

      this.rows = inserted.map(cloneRow);
      return this;
    }

    // delete matched rows
    delete() {
      if (!Array.isArray(db[this.table])) {
        return this;
      }
      const tableRows = db[this.table];
      const idsToRemove = new Set(this.rows.map((r) => r.id));
      db[this.table] = tableRows.filter((tr) => !idsToRemove.has(tr.id));
      saveDb();
      this.rows = [];
      return this;
    }

    maybeSingle() {
      const data = this.rows.length > 0 ? this.rows[0] : null;
      return Promise.resolve({ data, error: null });
    }

    async then(resolve: any) {
      // allow awaiting queries that expect data array
      return resolve({ data: this.rows, error: null });
    }

    // helper for explicit awaits of queries (e.g., const { data } = await supabase.from(...).select(...))
    toPromise() {
      return Promise.resolve({ data: this.rows, error: null });
    }
  }

  function ensureTable(name: string) {
    if (!Array.isArray(db[name])) db[name] = [];
  }

  function nextIdFor(table: string) {
    ensureTable(table);
    return db[table].reduce((acc, cur) => (typeof cur.id === "number" && cur.id > acc ? cur.id : acc), 0) + 1;
  }

  return {
    from(table: string) {
      return new Query(table);
    },
    async rpc(name: string, params?: any) {
      // implement a few RPCs used by the app: create_puzzle, update_puzzle, delete_puzzle, archive_past_puzzles
      try {
        if (name === "create_puzzle") {
          // params: puzzle_title, puzzle_publication_date, puzzle_status, puzzle_categories
          const puzzleId = nextIdFor("puzzles");
          ensureTable("puzzles");
          ensureTable("categories");
          ensureTable("words");

          const now = new Date().toISOString();
          const puzzleRow = {
            id: puzzleId,
            title: params.puzzle_title,
            publication_date: params.puzzle_publication_date,
            status: params.puzzle_status,
            created_by_user_id: params.puzzle_created_by_user_id ?? null,
            last_edited_by_user_id: params.puzzle_last_edited_by_user_id ?? params.puzzle_created_by_user_id ?? null,
            created_at: now,
            updated_at: now,
          };
          db.puzzles.push(puzzleRow);

          // categories and words
          params.puzzle_categories.forEach((cat: any, catIndex: number) => {
            const catId = nextIdFor("categories");
            const categoryRow = {
              id: catId,
              puzzle_id: puzzleId,
              name: cat.name,
              difficulty: catIndex + 1,
            };
            db.categories.push(categoryRow);

            cat.words.forEach((w: string, i: number) => {
              const wordId = nextIdFor("words");
              db.words.push({
                id: wordId,
                category_id: catId,
                value: w,
                position: i + 1,
                created_at: now,
                updated_at: now,
              });
            });
          });

          saveDb();
          return { data: puzzleId, error: null };
        }

        if (name === "update_puzzle") {
          // params: target_puzzle_id, puzzle_title, puzzle_publication_date, puzzle_status, puzzle_categories
          const pid = params.target_puzzle_id;
          ensureTable("puzzles");
          const puzzleIdx = db.puzzles.findIndex((p: any) => p.id === pid);
          if (puzzleIdx === -1) {
            return { data: null, error: { message: "Plansza nie istnieje" } };
          }

          const now = new Date().toISOString();
          db.puzzles[puzzleIdx] = {
            ...db.puzzles[puzzleIdx],
            title: params.puzzle_title,
            publication_date: params.puzzle_publication_date,
            status: params.puzzle_status,
            last_edited_by_user_id: params.puzzle_last_edited_by_user_id ?? db.puzzles[puzzleIdx].last_edited_by_user_id ?? null,
            updated_at: now,
          };

          // remove existing categories and words for this puzzle
          ensureTable("categories");
          ensureTable("words");
          const oldCategoryIds = db.categories.filter((c: any) => c.puzzle_id === pid).map((c: any) => c.id);
          db.categories = db.categories.filter((c: any) => c.puzzle_id !== pid);
          db.words = db.words.filter((w: any) => !oldCategoryIds.includes(w.category_id));

          // insert new categories/words
          params.puzzle_categories.forEach((cat: any, catIndex: number) => {
            const catId = nextIdFor("categories");
            db.categories.push({ id: catId, puzzle_id: pid, name: cat.name, difficulty: catIndex + 1 });
            cat.words.forEach((w: string, i: number) => {
              const wordId = nextIdFor("words");
              db.words.push({ id: wordId, category_id: catId, value: w, position: i + 1, created_at: now, updated_at: now });
            });
          });

          saveDb();
          return { data: null, error: null };
        }

        if (name === "delete_puzzle") {
          const pid = params.target_puzzle_id;
          ensureTable("puzzles");
          const puzzleIdx = db.puzzles.findIndex((p: any) => p.id === pid);
          if (puzzleIdx === -1) {
            return { data: null, error: { message: "nie istnieje" } };
          }
          const catIds = db.categories.filter((c: any) => c.puzzle_id === pid).map((c: any) => c.id);
          db.categories = db.categories.filter((c: any) => c.puzzle_id !== pid);
          db.words = db.words.filter((w: any) => !catIds.includes(w.category_id));
          db.puzzles = db.puzzles.filter((p: any) => p.id !== pid);
          saveDb();
          return { data: null, error: null };
        }

        if (name === "archive_past_puzzles") {
          // simple no-op for dev
          return { data: null, error: null };
        }

        // unknown rpc: no-op
        return { data: null, error: null };
      } catch (err: any) {
        return { data: null, error: { message: err?.message || String(err) } };
      }
    },
    // minimal auth placeholder
    auth: {
      admin: {
        async getUserById(userId: string) {
          return {
            data: {
              user: {
                id: userId,
                email: `moderator-${userId.slice(0, 8)}@example.com`,
              },
            },
            error: null,
          };
        },
      },
      getUser() {
        return Promise.resolve({ data: null, error: null });
      },
      signOut() {
        return Promise.resolve({ error: null });
      },
    },
  } as any;
}
