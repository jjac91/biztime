process.env.NODE_ENV = "test";
const request = require("supertest");

const app = require("../app");
const db = require("../db");

beforeEach(async function () {
  await db.query("DELETE FROM invoices");
  await db.query("DELETE FROM companies");
  await db.query("SELECT setval('invoices_id_seq', 1, false)");

  await db.query(`INSERT INTO companies (code, name, description)
                    VALUES ('apple', 'Apple Computer', 'Maker of OSX.'),
                           ('ibm', 'IBM', 'Big blue.')`);

  const inv = await db.query(
    `INSERT INTO invoices (comp_code, amt, paid, add_date, paid_date)
           VALUES ('apple', 100, false, '2018-01-01', null),
                  ('apple', 200, true, '2018-02-01', '2018-02-02'), 
                  ('ibm', 300, false, '2018-03-01', null)
           RETURNING id`
  );
});

afterAll(async () => {
  await db.end();
});

describe("GET /", function () {
  test("It should respond with array of invoices", async function () {
    const response = await request(app).get("/invoices");
    expect(response.body).toEqual({
      invoices: [
        { id: 1, comp_code: "apple" },
        { id: 2, comp_code: "apple" },
        { id: 3, comp_code: "ibm" },
      ],
    });
  });
});

describe("GET /1", function () {
  test("It should return invoice info", async function () {
    const response = await request(app).get("/invoices/1");
    expect(response.body).toEqual({
      invoice: {
        id: 1,
        amt: 100,
        add_date: "2018-01-01T05:00:00.000Z",
        paid: false,
        paid_date: null,
        company: {
          code: "apple",
          name: "Apple Computer",
          description: "Maker of OSX.",
        },
      },
    });
  });

  test("It should return 404 for a non-existant invoice", async function () {
    const response = await request(app).get("/companies/blargh");
    expect(response.status).toEqual(404);
  });
});

describe("POST /", function () {
  test("It should add a new invoice", async function () {
    const response = await request(app)
      .post("/invoices")
      .send({ amt: "500", comp_code: "apple" });

    expect(response.body).toEqual({
      invoice: {
        id: 4,
        comp_code: "apple",
        amt: 500,
        add_date: expect.any(String),
        paid: false,
        paid_date: null,
      },
    });
  });
});

describe("PUT /", function () {
  test("It should update an invoice", async function () {
    const response = await request(app)
      .put("/invoices/1")
      .send({ amt: 1000, paid: false });

    expect(response.body).toEqual({
      invoice: {
        id: 1,
        comp_code: "apple",
        paid: false,
        amt: 1000,
        add_date: expect.any(String),
        paid_date: null,
      },
    });
  });

  test("It should return 404 for non existant comp", async function () {
    const response = await request(app).put("/invoices/25").send({ amt: 5000 });

    expect(response.status).toEqual(404);
  });

  test("It should return 500 for missing data", async function () {
    const response = await request(app).put("/invoices/1").send({});

    expect(response.status).toEqual(500);
  });
});

describe("DELETE /", function () {
  test("It should delete invoice", async function () {
    const response = await request(app).delete("/invoices/1");

    expect(response.body).toEqual({ status: "deleted" });
  });

  test("It should return 404 for non existant invoice", async function () {
    const response = await request(app).delete("/invoices/9999");

    expect(response.status).toEqual(404);
  });
});
