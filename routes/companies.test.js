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
  test("It should respond with array of companies", async function () {
    const response = await request(app).get("/companies");
    expect(response.body).toEqual({
      companies: [
        { code: "apple", name: "Apple Computer" },
        { code: "ibm", name: "IBM" },
      ],
    });
  });
});

describe("GET /ibm", function () {
  test("It should return company info", async function () {
    const response = await request(app).get("/companies/ibm");
    expect(response.body).toEqual({
      company: {
        code: "ibm",
        name: "IBM",
        description: "Big blue.",
        invoices: [3],
      },
    });
  });

  test("It should return 404 for a non-existant company", async function () {
    const response = await request(app).get("/companies/blargh");
    expect(response.status).toEqual(404);
  });
});

describe("POST /", function () {
  test("It should add a new company", async function () {
    const response = await request(app)
      .post("/companies")
      .send({ name: "Ben Burger", description: "burgers" });

    expect(response.body).toEqual({
      company: {
        code: "ben-burger",
        name: "Ben Burger",
        description: "burgers",
      },
    });
  });

  test("It should return 500 for conflict", async function () {
    const response = await request(app)
      .post("/companies")
      .send({ name: "Apple", description: "impossible?" });

    expect(response.status).toEqual(500);
  });
});

describe("PUT /", function () {

    test("It should update the company", async function () {
      const response = await request(app)
          .put("/companies/ibm")
          .send({name: "bim", description: "bim"});
  
      expect(response.body).toEqual(
          {
            "company": {
              code: "ibm",
              name: "bim",
              description: "bim",
            }
          }
      );
    })

    test("It should return 404 for non existant comp", async function () {
        const response = await request(app)
            .put("/companies/dsafs")
            .send({name: "dafds"});
    
        expect(response.status).toEqual(404);
      });
    
      test("It should return 500 for missing data", async function () {
        const response = await request(app)
            .put("/companies/apple")
            .send({});
    
        expect(response.status).toEqual(500);
      })
    });

    describe("DELETE /", function () {

        test("It should delete company", async function () {
          const response = await request(app)
              .delete("/companies/apple");
      
          expect(response.body).toEqual({"status": "deleted"});
        });
      
        test("It should return 404 for nnon existant comp", async function () {
          const response = await request(app)
              .delete("/companies/dsdfds");
      
          expect(response.status).toEqual(404);
        });
      });